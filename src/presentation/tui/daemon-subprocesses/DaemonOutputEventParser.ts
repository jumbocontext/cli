import { DaemonEventCategory } from "./DaemonEventCategory.js";
import type { DaemonEventSnapshot } from "./DaemonEventSnapshot.js";
import { DaemonEventStatus } from "./DaemonEventStatus.js";
import type { DaemonName } from "./DaemonName.js";

const EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

export class DaemonOutputEventParser {
  parseOutputLine(daemon: DaemonName, line: string): DaemonEventSnapshot {
    const parsedEvent = this.parseStructuredEvent(line);

    if (parsedEvent !== null) {
      return this.boundEvent(parsedEvent);
    }

    return {
      daemon,
      status: DaemonEventStatus.PROCESSING,
      source: daemon,
      category: DaemonEventCategory.MODEL_OUTPUT,
      message: this.limitTextTail(line),
      timestampMs: Date.now(),
    };
  }

  boundTextField(value: string): string {
    return this.limitTextTail(value);
  }

  boundOptionalTextField(value: string | undefined): string | undefined {
    return value === undefined ? undefined : this.limitTextTail(value);
  }

  boundEvent(event: DaemonEventSnapshot): DaemonEventSnapshot {
    return {
      ...event,
      daemon: this.limitTextTail(event.daemon),
      status: this.limitTextTail(event.status),
      source: this.boundOptionalTextField(event.source),
      category: this.boundOptionalTextField(event.category),
      message: this.boundOptionalTextField(event.message),
      phase: this.boundOptionalTextField(event.phase),
      goalId: this.boundOptionalTextField(event.goalId),
      errorType: this.boundOptionalTextField(event.errorType),
      errorMessage: this.boundOptionalTextField(event.errorMessage),
    };
  }

  private parseStructuredEvent(line: string): DaemonEventSnapshot | null {
    try {
      const parsed = JSON.parse(line) as DaemonEventSnapshot;
      if (
        typeof parsed.daemon !== "string" ||
        typeof parsed.status !== "string"
      ) {
        return null;
      }
      return {
        ...parsed,
        timestampMs: parsed.timestampMs ?? Date.now(),
      };
    } catch {
      return null;
    }
  }

  private limitTextTail(value: string): string {
    return value.length > EVENT_TEXT_FIELD_MAX_LENGTH
      ? value.slice(-EVENT_TEXT_FIELD_MAX_LENGTH)
      : value;
  }
}
