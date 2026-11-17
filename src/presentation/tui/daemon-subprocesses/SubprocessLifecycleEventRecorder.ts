import type { ILogger } from "../../../application/logging/ILogger.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import { DaemonEventCategory } from "./DaemonEventCategory.js";
import type { DaemonEventSnapshot } from "./DaemonEventSnapshot.js";
import { DaemonEventStatus } from "./DaemonEventStatus.js";
import { SubprocessCopy } from "./SubprocessCopy.js";
import { SubprocessStatus } from "./SubprocessStatus.js";
import { DaemonOutputEventParser } from "./DaemonOutputEventParser.js";

const EVENT_RING_BUFFER_SIZE = 50;
const COALESCED_EVENT_CATEGORIES = new Set([
  "foraging",
  "waiting",
  "polling",
  "heartbeat",
]);
const RETAINED_OUTCOME_CATEGORIES = new Set([
  "completed",
  "failed",
  "exhausted",
  "stopped",
]);

const SUBPROCESS_EVENT_COPY = {
  stopping: {
    category: DaemonEventCategory.STOPPING,
    message: SubprocessCopy.terminationRequested,
  },
  stopped: {
    category: DaemonEventCategory.STOPPED,
    message: SubprocessCopy.processStopped,
  },
  failed: {
    category: DaemonEventCategory.FAILED,
    message: SubprocessCopy.processFailed,
  },
} as const;

export class SubprocessLifecycleEventRecorder {
  constructor(
    private readonly logger: ILogger,
    private readonly outputEventParser = new DaemonOutputEventParser(),
  ) {}

  recordStopping(process: ManagedSubprocess): void {
    this.recordLifecycleEvent(process, {
      status: DaemonEventStatus.STOPPING,
      ...SUBPROCESS_EVENT_COPY.stopping,
    });
  }

  recordStopped(process: ManagedSubprocess): void {
    this.recordLifecycleEvent(process, {
      status: DaemonEventStatus.STOPPED,
      ...SUBPROCESS_EVENT_COPY.stopped,
    });
  }

  recordFailed(process: ManagedSubprocess, errorMessage: string): void {
    this.recordLifecycleEvent(process, {
      status: DaemonEventStatus.FAILED,
      errorMessage,
      ...SUBPROCESS_EVENT_COPY.failed,
    });
  }

  recordTerminalEvent(
    process: ManagedSubprocess,
    errorMessage = process.stderr[process.stderr.length - 1],
  ): void {
    const status =
      process.status === SubprocessStatus.STOPPED
        ? DaemonEventStatus.STOPPED
        : DaemonEventStatus.FAILED;
    this.recordLifecycleEvent(process, {
      status,
      exitCode: process.exitCode ?? undefined,
      errorMessage:
        status === DaemonEventStatus.FAILED ? errorMessage : undefined,
      ...(status === DaemonEventStatus.STOPPED
        ? SUBPROCESS_EVENT_COPY.stopped
        : SUBPROCESS_EVENT_COPY.failed),
    });
  }

  recordDaemonEvent(
    process: ManagedSubprocess,
    event: DaemonEventSnapshot,
  ): void {
    const boundedEvent = this.outputEventParser.boundEvent(event);
    this.logger.info(SubprocessCopy.eventLog, {
      daemon: process.name,
      event: boundedEvent,
    });
    const coalescedIndex = this.findCoalescedEventIndex(process, boundedEvent);
    if (coalescedIndex !== -1) {
      process.events.splice(coalescedIndex, 1);
    }
    process.events.push(boundedEvent);
    while (process.events.length > EVENT_RING_BUFFER_SIZE) {
      const removableIndex = this.findOldestRemovableEventIndex(process.events);
      process.events.splice(removableIndex, 1);
    }
  }

  boundErrorForLog(error: unknown): unknown {
    if (!(error instanceof Error)) {
      return error;
    }

    const bounded = new Error(
      this.outputEventParser.boundTextField(error.message),
    );
    bounded.name = error.name;
    bounded.stack = this.outputEventParser.boundOptionalTextField(error.stack);
    return bounded;
  }

  private recordLifecycleEvent(
    process: ManagedSubprocess,
    event: Omit<DaemonEventSnapshot, "daemon" | "source" | "timestampMs">,
  ): void {
    const lastEvent = process.events[process.events.length - 1];
    if (
      lastEvent?.source === process.name &&
      lastEvent.status === event.status
    ) {
      return;
    }

    this.recordDaemonEvent(process, {
      daemon: process.name,
      source: process.name,
      timestampMs: Date.now(),
      ...event,
    });
  }

  private findCoalescedEventIndex(
    process: ManagedSubprocess,
    event: DaemonEventSnapshot,
  ): number {
    if (
      event.category === undefined ||
      !COALESCED_EVENT_CATEGORIES.has(event.category)
    ) {
      return -1;
    }

    for (let index = process.events.length - 1; index >= 0; index--) {
      const candidate = process.events[index];
      if (
        candidate.category === undefined ||
        !COALESCED_EVENT_CATEGORIES.has(candidate.category)
      ) {
        return -1;
      }
      if (
        candidate.source === event.source &&
        candidate.status === event.status &&
        candidate.category === event.category &&
        candidate.message === event.message &&
        candidate.goalId === event.goalId
      ) {
        return index;
      }
    }

    return -1;
  }

  private findOldestRemovableEventIndex(
    events: readonly DaemonEventSnapshot[],
  ): number {
    let retainedOutcomeIndex = -1;
    for (let index = events.length - 1; index >= 0; index--) {
      const category = events[index].category;
      if (category !== undefined && RETAINED_OUTCOME_CATEGORIES.has(category)) {
        retainedOutcomeIndex = index;
        break;
      }
    }
    const removableIndex = events.findIndex(
      (_event, index) => index !== retainedOutcomeIndex,
    );
    return removableIndex === -1 ? 0 : removableIndex;
  }
}
