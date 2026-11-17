import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { SessionId } from "./SessionId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  SessionEvent,
  SessionStartedEvent,
  SessionEndedEvent,
} from "./EventIndex.js";
import {
  SessionEventType,
  SessionStatus,
  SessionStatusType,
  SessionErrorMessages,
} from "./Constants.js";
import { FOCUS_RULES } from "./rules/FocusRules.js";
import { SUMMARY_RULES } from "./rules/SummaryRules.js";

// Domain state: business properties + aggregate metadata
export interface SessionState extends AggregateState {
  id: SessionId; // Session ID
  focus: string; // Theme of the work accomplished (set at session end)
  status: SessionStatusType; // Current session status
  version: number; // Aggregate version for event sourcing
}

export class Session extends BaseAggregate<SessionState, SessionEvent> {
  private constructor(state: SessionState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: SessionState, event: SessionEvent): void {
    switch (event.type) {
      case SessionEventType.STARTED: {
        state.status = SessionStatus.ACTIVE;
        state.version = event.version;
        break;
      }
      case SessionEventType.ENDED: {
        const e = event as SessionEndedEvent;
        state.focus = e.payload.focus;
        state.status = SessionStatus.ENDED;
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: SessionId = SessionId.create()): Session {
    const state: SessionState = {
      id,
      focus: "",
      status: SessionStatus.ACTIVE,
      version: 0,
    };
    return new Session(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Session from event store.
   */
  static rehydrate(id: UUID, history: SessionEvent[]): Session {
    const state: SessionState = {
      id: SessionId.fromLegacy(id),
      focus: "",
      status: SessionStatus.ACTIVE,
      version: 0,
    };

    for (const event of history) {
      Session.apply(state, event);
    }

    return new Session(state);
  }

  start(): SessionStartedEvent {
    // State validation
    if (this.state.version > 0) {
      throw new Error(SessionErrorMessages.ALREADY_STARTED);
    }

    // No input validation needed - session start has no parameters
    // Focus is captured at session end as a summary of accomplishments

    // Use BaseAggregate.makeEvent
    return this.makeEvent(
      SessionEventType.STARTED,
      {},
      Session.apply,
    ) as SessionStartedEvent;
  }

  /**
   * Ends the session with a focus summary.
   * @throws Error if session is already ended
   */
  end(focus: string, summary?: string): SessionEndedEvent {
    // 1. State validation
    if (this.state.status === SessionStatus.ENDED) {
      throw new Error(SessionErrorMessages.SESSION_ALREADY_ENDED);
    }

    // 2. Input validation using rules
    ValidationRuleSet.ensure(focus, FOCUS_RULES);
    if (summary) {
      ValidationRuleSet.ensure(summary, SUMMARY_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent()
    return this.makeEvent(
      SessionEventType.ENDED,
      {
        focus,
        summary: summary || null,
      },
      Session.apply,
    ) as SessionEndedEvent;
  }
}
