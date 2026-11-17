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
import { IGoalSubmitForReviewReader } from "./IGoalSubmitForReviewReader.js";

const REVIEW_COMPLETE_STATUSES = new Set<string>([
  GoalStatus.QUALIFIED,
  GoalStatus.REJECTED,
]);
const REVIEWER_EVENT_SOURCE = "reviewer";
const REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const REVIEWER_EVENT_COPY = {
  noWork: {
    category: "waiting",
    message: "awaiting submitted goals",
  },
  workStarted: {
    category: "work-started",
    message: "reviewing goal",
  },
  completed: {
    category: "completed",
    message: "review completed",
  },
  skipped: {
    category: "skipped",
    message: "review not completed after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "review attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "review failed",
  },
} as const;

export class ReviewerProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalSubmitForReviewReader,
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
      REVIEWER_EVENT_SOURCE,
      options,
      startedAt,
    );
    events.emit("processing", "polling", "polling for submitted goals", {
      phase: "polling",
    });
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      events.emit(
        "idle",
        REVIEWER_EVENT_COPY.noWork.category,
        REVIEWER_EVENT_COPY.noWork.message,
        { phase: "idle" },
      );
      this.track(startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];
    events.emit("processing", "selection", "selected goal for review", {
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
        REVIEWER_EVENT_COPY.workStarted.category,
        REVIEWER_EVENT_COPY.workStarted.message,
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

      if (await this.isReviewComplete(goal.goalId)) {
        events.emit(
          "completed",
          REVIEWER_EVENT_COPY.completed.category,
          REVIEWER_EVENT_COPY.completed.message,
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
          ? REVIEWER_EVENT_COPY.exhausted.category
          : REVIEWER_EVENT_COPY.skipped.category,
        retryExhausted
          ? REVIEWER_EVENT_COPY.exhausted.message
          : REVIEWER_EVENT_COPY.skipped.message,
        {
          phase: retryExhausted ? "exhausted" : "retry",
          ...attemptContext,
          exitCode: result.exitCode,
        },
      );
      if (!retryExhausted) {
        events.emit("processing", "retry", "retrying review", {
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
    const goals = await this.goalStatusReader.findByStatus(
      GoalStatus.SUBMITTED,
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
      `Run the Jumbo review workflow for goal ${goalId}.`,
      `Start by claiming the goal with: jumbo goal review --id ${goalId}.`,
      "If that command reports the goal is claimed by another worker, stop and report the claim conflict without making changes.",
      `If the implementation passes QA, run: jumbo goal approve --id ${goalId}`,
      `If it fails QA, run: jumbo goal reject --id ${goalId} --review-issues "describe the issues"`,
    ].join(" ");
  }

  private async isReviewComplete(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return REVIEW_COMPLETE_STATUSES.has(goal?.status ?? "unknown");
  }

  private track(startedAt: bigint, properties: Record<string, unknown>): void {
    this.telemetryClient.track("reviewer_process_completed", {
      daemon: "reviewer",
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
          REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH,
        ),
        errorStack:
          error.stack === undefined
            ? undefined
            : limitTextTail(error.stack, REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }
    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(
        String(error),
        REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH,
      ),
    };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
