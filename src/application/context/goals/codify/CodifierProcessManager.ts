import type {
  IProcessManager,
  ProcessManagerEvent,
  ProcessManagerOptions,
  ProcessManagerResult,
  ProcessManagerStatus,
} from "../../../daemons/IProcessManager.js";
import { ProcessManagerEventEmitter } from "../../../daemons/ProcessManagerEventEmitter.js";
import { IAgentGateway } from "../../../agents/IAgentGateway.js";
import { ITelemetryClient } from "../../../telemetry/ITelemetryClient.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalView } from "../GoalView.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IGoalCodifyReader } from "./IGoalCodifyReader.js";

const CODIFIER_EVENT_SOURCE = "codifier";
const CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const CODIFIER_EVENT_COPY = {
  noWork: {
    category: "waiting",
    message: "awaiting approved goals",
  },
  workStarted: {
    category: "work-started",
    message: "codifying goal",
  },
  completed: {
    category: "completed",
    message: "goal codified",
  },
  skipped: {
    category: "skipped",
    message: "goal not codified after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "codification attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "codification failed",
  },
} as const;

export type CodifierProcessStatus = ProcessManagerStatus;

export interface CodifierProcessEvent extends ProcessManagerEvent {
  readonly daemon: "codifier";
}

export type CodifierProcessOptions = ProcessManagerOptions;

export type CodifierProcessResult = ProcessManagerResult;

export class CodifierProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalCodifyReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly agentGateway: IAgentGateway,
    private readonly telemetryClient: ITelemetryClient,
  ) {}

  async processNext(
    options: CodifierProcessOptions,
  ): Promise<CodifierProcessResult> {
    const startedAt = process.hrtime.bigint();
    const events = new ProcessManagerEventEmitter(
      CODIFIER_EVENT_SOURCE,
      options,
      startedAt,
    );
    events.emit("processing", "polling", "polling for approved goals", {
      phase: "polling",
    });
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      events.emit(
        "idle",
        CODIFIER_EVENT_COPY.noWork.category,
        CODIFIER_EVENT_COPY.noWork.message,
        { phase: "idle" },
      );
      this.track("codifier_process_completed", startedAt, {
        status: "idle",
        attempts: 0,
      });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];
    events.emit("processing", "selection", "selected goal for codification", {
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
        CODIFIER_EVENT_COPY.workStarted.category,
        CODIFIER_EVENT_COPY.workStarted.message,
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

      if (await this.isGoalDone(goal.goalId)) {
        events.emit(
          "completed",
          CODIFIER_EVENT_COPY.completed.category,
          CODIFIER_EVENT_COPY.completed.message,
          {
            phase: "completed",
            ...attemptContext,
            exitCode: result.exitCode,
          },
        );
        this.track("codifier_process_completed", startedAt, {
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
          ? CODIFIER_EVENT_COPY.exhausted.category
          : CODIFIER_EVENT_COPY.skipped.category,
        retryExhausted
          ? CODIFIER_EVENT_COPY.exhausted.message
          : CODIFIER_EVENT_COPY.skipped.message,
        {
          phase: retryExhausted ? "exhausted" : "retry",
          ...attemptContext,
          exitCode: result.exitCode,
        },
      );
      if (!retryExhausted) {
        events.emit("processing", "retry", "retrying codification", {
          phase: "retry",
          ...attemptContext,
        });
      }
    }

    this.track("codifier_process_completed", startedAt, {
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
    const goals = await this.goalStatusReader.findByStatus(
      GoalStatus.QUALIFIED,
    );
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
      `Run the Jumbo codification workflow for goal ${goalId}.`,
      `Start by claiming the goal with: jumbo goal codify --id ${goalId}.`,
      "If that command reports the goal is claimed by another worker, stop and report the claim conflict without making changes.",
      "Otherwise review the codification instructions, reconcile any architectural context changes, then close the goal with:",
      `jumbo goal close --id ${goalId}`,
    ].join(" ");
  }

  private async isGoalDone(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return goal?.status === GoalStatus.DONE;
  }

  private track(
    eventName: string,
    startedAt: bigint,
    properties: Record<string, unknown>,
  ): void {
    this.telemetryClient.track(eventName, {
      daemon: "codifier",
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
          CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH,
        ),
        errorStack:
          error.stack === undefined
            ? undefined
            : limitTextTail(error.stack, CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }

    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(
        String(error),
        CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH,
      ),
    };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
