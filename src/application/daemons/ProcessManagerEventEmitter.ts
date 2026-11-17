import type {
  ProcessManagerEvent,
  ProcessManagerOptions,
  ProcessManagerStatus,
} from "./IProcessManager.js";

const EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

export class ProcessManagerEventEmitter {
  constructor(
    private readonly daemon: string,
    private readonly options: ProcessManagerOptions,
    private readonly startedAt: bigint,
  ) {}

  emit(
    status: ProcessManagerStatus,
    category: string,
    message: string,
    event: Omit<
      ProcessManagerEvent,
      | "daemon"
      | "status"
      | "source"
      | "category"
      | "message"
      | "timestampMs"
      | "elapsedMs"
    > = {},
  ): void {
    this.options.emit?.({
      daemon: this.daemon,
      status,
      source: this.daemon,
      category,
      message,
      timestampMs: Date.now(),
      elapsedMs: this.elapsedMs(),
      ...event,
    });
  }

  emitAgentActivity(
    stream: "stdout" | "stderr",
    text: string,
    context: Pick<ProcessManagerEvent, "goalId" | "attempt" | "maxRetries">,
  ): void {
    for (const line of text.split(/\r?\n/)) {
      const message = line.trim();
      if (message.length === 0) {
        continue;
      }

      this.options.emit?.({
        daemon: this.daemon,
        status: "processing",
        source: "agent",
        category: stream === "stdout" ? "model-output" : "agent-stderr",
        message: limitTextTail(message, EVENT_TEXT_FIELD_MAX_LENGTH),
        timestampMs: Date.now(),
        elapsedMs: this.elapsedMs(),
        phase: "agent",
        ...context,
      });
    }
  }

  private elapsedMs(): number {
    return Number(
      (process.hrtime.bigint() - this.startedAt) / BigInt(1_000_000),
    );
  }
}

export function limitProcessEventTextTail(
  value: string,
  maxLength = EVENT_TEXT_FIELD_MAX_LENGTH,
): string {
  return limitTextTail(value, maxLength);
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
