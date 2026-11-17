import { IAgentGateway } from "../../../agents/IAgentGateway.js";
import {
  IProcessManager,
  ProcessManagerOptions,
  ProcessManagerResult,
} from "../../../daemons/IProcessManager.js";
import { ProcessManagerEventEmitter } from "../../../daemons/ProcessManagerEventEmitter.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { ITelemetryClient } from "../../../telemetry/ITelemetryClient.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../GoalView.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IGoalRefineReader } from "./IGoalRefineReader.js";

const REFINER_EVENT_SOURCE = "refiner";
const REFINER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const REFINER_EVENT_COPY = {
  noWork: {
    category: "foraging",
    message: "foraging for defined goals",
  },
  workStarted: {
    category: "work-started",
    message: "refining goal",
  },
  completed: {
    category: "completed",
    message: "goal refined",
  },
  skipped: {
    category: "skipped",
    message: "goal not refined after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "refinement attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "refinement failed",
  },
} as const;

export class RefinerProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalRefineReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly agentGateway: IAgentGateway,
    private readonly telemetryClient: ITelemetryClient,
  ) {}

  async processNext(
    options: ProcessManagerOptions,
  ): Promise<ProcessManagerResult> {
    const startedAt = process.hrtime.bigint();
    const events = new ProcessManagerEventEmitter(
      REFINER_EVENT_SOURCE,
      options,
      startedAt,
    );
    events.emit("processing", "polling", "polling for defined goals", {
      phase: "polling",
    });
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      events.emit(
        "idle",
        REFINER_EVENT_COPY.noWork.category,
        REFINER_EVENT_COPY.noWork.message,
        { phase: "idle" },
      );
      this.track(startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];
    events.emit("processing", "selection", "selected goal for refinement", {
      phase: "selection",
      goalId: goal.goalId,
    });

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      const attemptContext = {
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
      };
      events.emit(
        "processing",
        REFINER_EVENT_COPY.workStarted.category,
        REFINER_EVENT_COPY.workStarted.message,
        {
          phase: "working",
          ...attemptContext,
        },
      );
      let sawAgentActivity = false;
      const invocation = {
        agentId: options.agentId,
        prompt: this.buildPrompt(goal.goalId),
        onActivity: (activity: {
          readonly stream: "stdout" | "stderr";
          readonly text: string;
        }) => {
          sawAgentActivity = true;
          events.emitAgentActivity(
            activity.stream,
            activity.text,
            attemptContext,
          );
        },
      };
      const result = await this.agentGateway.invoke(invocation);
      if (!sawAgentActivity) {
        this.emitReturnedAgentOutput(events, result, attemptContext);
      }

      if (await this.isGoalRefined(goal.goalId)) {
        events.emit(
          "completed",
          REFINER_EVENT_COPY.completed.category,
          REFINER_EVENT_COPY.completed.message,
          {
            phase: "completed",
            ...attemptContext,
            exitCode: result.exitCode,
          },
        );
        this.track(startedAt, {
          status: "completed",
          attempts: attempt,
          goalId: goal.goalId,
          agentExitCode: result.exitCode,
        });
        return { status: "completed", goalId: goal.goalId, attempts: attempt };
      }

      const retryExhausted = attempt === options.maxRetries;
      events.emit(
        retryExhausted ? "exhausted" : "skipped",
        retryExhausted
          ? REFINER_EVENT_COPY.exhausted.category
          : REFINER_EVENT_COPY.skipped.category,
        retryExhausted
          ? REFINER_EVENT_COPY.exhausted.message
          : REFINER_EVENT_COPY.skipped.message,
        {
          phase: retryExhausted ? "exhausted" : "retry",
          ...attemptContext,
          exitCode: result.exitCode,
          ...this.agentFailureProperties(result),
        },
      );
      if (!retryExhausted) {
        events.emit("processing", "retry", "retrying refinement", {
          phase: "retry",
          ...attemptContext,
        });
      }
    }

    this.track(startedAt, {
      status: "exhausted",
      attempts: options.maxRetries,
      goalId: goal.goalId,
    });
    return {
      status: "exhausted",
      goalId: goal.goalId,
      attempts: options.maxRetries,
    };
  }

  async selectEligibleGoals(): Promise<GoalView[]> {
    const goals = await this.goalStatusReader.findByStatus(GoalStatus.TODO);
    const workerId = this.workerIdentityReader.workerId;
    return goals
      .filter(
        (goal) => this.claimPolicy.canClaim(goal.goalId, workerId).allowed,
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  buildPrompt(goalId: string): string {
    return [
      `Run the Jumbo refinement workflow for goal ${goalId}.`,
      `Start by claiming the goal with: jumbo goal refine --id ${goalId}.`,
      "If that command reports the goal is claimed by another worker, stop and report the claim conflict without making changes.",
      `Otherwise update the goal context as needed, then complete refinement with: jumbo goal commit --id ${goalId}`,
    ].join(" ");
  }

  private async isGoalRefined(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return goal?.status === GoalStatus.REFINED;
  }

  private track(startedAt: bigint, properties: Record<string, unknown>): void {
    this.telemetryClient.track("refiner_process_completed", {
      daemon: "refiner",
      durationMs: Number(
        (process.hrtime.bigint() - startedAt) / BigInt(1_000_000),
      ),
      ...properties,
    });
  }

  private emitReturnedAgentOutput(
    events: ProcessManagerEventEmitter,
    result: { readonly stdout?: string; readonly stderr?: string },
    context: {
      readonly goalId: string;
      readonly attempt: number;
      readonly maxRetries: number;
    },
  ): void {
    if (result.stdout !== undefined) {
      events.emitAgentActivity("stdout", result.stdout, context);
    }
    if (result.stderr !== undefined) {
      events.emitAgentActivity("stderr", result.stderr, context);
    }
  }

  private errorProperties(error: unknown): {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
  } {
    if (error instanceof Error) {
      return {
        errorType: error.name,
        errorMessage: limitTextTail(
          error.message,
          REFINER_EVENT_TEXT_FIELD_MAX_LENGTH,
        ),
        errorStack:
          error.stack === undefined
            ? undefined
            : limitTextTail(error.stack, REFINER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }
    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(
        String(error),
        REFINER_EVENT_TEXT_FIELD_MAX_LENGTH,
      ),
    };
  }

  private agentFailureProperties(result: {
    readonly exitCode: number;
    readonly stderr?: string;
  }): { errorMessage?: string } {
    if (
      result.exitCode === 0 ||
      result.stderr === undefined ||
      result.stderr.trim().length === 0
    ) {
      return {};
    }
    const lastLine = result.stderr.trim().split(/\r?\n/).at(-1);
    return lastLine === undefined
      ? {}
      : {
          errorMessage: limitTextTail(
            lastLine,
            REFINER_EVENT_TEXT_FIELD_MAX_LENGTH,
          ),
        };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
