import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID, ISO8601 } from "../BaseEvent.js";
import type { DecisionRemovedEvent } from "./remove/DecisionRemovedEvent.js";
import { DecisionId } from "./DecisionId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import { DecisionEvent, DecisionAddedEvent, DecisionUpdatedEvent, DecisionReversedEvent, DecisionSupersededEvent, DecisionRestoredEvent } from "./EventIndex.js";
import { DecisionEventType, DecisionStatus, DecisionStatusType, DecisionErrorMessages } from "./Constants.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { CONTEXT_RULES } from "./rules/ContextRules.js";
import { RATIONALE_RULES } from "./rules/RationaleRules.js";
import { ALTERNATIVES_RULES } from "./rules/AlternativesRules.js";
import { CONSEQUENCES_RULES } from "./rules/ConsequencesRules.js";
import { REASON_RULES } from "./rules/ReasonRules.js";
import { SUPERSEDED_BY_RULES } from "./rules/SupersededByRules.js";

// Domain state: business properties + aggregate metadata
export interface DecisionState extends AggregateState {
  id: DecisionId;
  title: string;
  context: string;
  rationale: string | null;
  alternatives: string[];
  consequences: string | null;
  status: DecisionStatusType;
  supersededBy: UUID | null;
  reversalReason: string | null;
  reversedAt: string | null;
  version: number;
}

export class Decision extends BaseAggregate<DecisionState, DecisionEvent> {
  private constructor(state: DecisionState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: DecisionState, event: DecisionEvent): void {
    switch (event.type) {
      case DecisionEventType.ADDED: {
        const e = event as DecisionAddedEvent;
        state.title = e.payload.title;
        state.context = e.payload.context;
        state.rationale = e.payload.rationale;
        state.alternatives = e.payload.alternatives;
        state.consequences = e.payload.consequences;
        state.status = DecisionStatus.ACTIVE;
        state.version = e.version;
        break;
      }
      case DecisionEventType.UPDATED: {
        const e = event as DecisionUpdatedEvent;
        if (e.payload.title !== undefined) state.title = e.payload.title;
        if (e.payload.context !== undefined) state.context = e.payload.context;
        if (e.payload.rationale !== undefined) state.rationale = e.payload.rationale;
        if (e.payload.alternatives !== undefined) state.alternatives = e.payload.alternatives;
        if (e.payload.consequences !== undefined) state.consequences = e.payload.consequences;
        state.version = e.version;
        break;
      }
      case DecisionEventType.REVERSED: {
        const e = event as DecisionReversedEvent;
        state.status = DecisionStatus.REVERSED;
        state.reversalReason = e.payload.reason;
        state.reversedAt = e.payload.reversedAt;
        state.version = e.version;
        break;
      }
      case DecisionEventType.SUPERSEDED: {
        const e = event as DecisionSupersededEvent;
        state.status = DecisionStatus.SUPERSEDED;
        state.supersededBy = e.payload.supersededBy;
        state.version = e.version;
        break;
      }
      case DecisionEventType.REMOVED: {
        state.status = DecisionStatus.REMOVED;
        state.version = event.version;
        break;
      }
      case DecisionEventType.RESTORED: {
        const e = event as DecisionRestoredEvent;
        state.status = DecisionStatus.ACTIVE;
        state.reversalReason = null;
        state.reversedAt = null;
        state.supersededBy = null;
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: DecisionId = DecisionId.create()): Decision {
    const state: DecisionState = {
      id,
      title: "",
      context: "",
      rationale: null,
      alternatives: [],
      consequences: null,
      status: DecisionStatus.ACTIVE,
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
      version: 0,
    };
    return new Decision(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Decision from event store.
   */
  static rehydrate(id: UUID, history: DecisionEvent[]): Decision {
    const state: DecisionState = {
      id: DecisionId.fromLegacy(id),
      title: "",
      context: "",
      rationale: null,
      alternatives: [],
      consequences: null,
      status: DecisionStatus.ACTIVE,
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
      version: 0,
    };

    for (const event of history) {
      Decision.apply(state, event);
    }

    return new Decision(state);
  }

  /**
   * Add a new decision.
   * This is the initial event that creates the decision aggregate.
   */
  add(
    title: string,
    context: string,
    rationale?: string,
    alternatives?: string[],
    consequences?: string
  ): DecisionAddedEvent {
    // State validation: must be new aggregate
    if (this.state.version > 0) {
      throw new Error('Decision already exists. Use update() instead.');
    }

    // Input validation using rules
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(context, CONTEXT_RULES);
    if (rationale) ValidationRuleSet.ensure(rationale, RATIONALE_RULES);
    if (alternatives) ValidationRuleSet.ensure(alternatives, ALTERNATIVES_RULES);
    if (consequences) ValidationRuleSet.ensure(consequences, CONSEQUENCES_RULES);

    // Create and return event
    return this.makeEvent(
      DecisionEventType.ADDED,
      {
        title,
        context,
        rationale: rationale || null,
        alternatives: alternatives || [],
        consequences: consequences || null
      },
      Decision.apply
    ) as DecisionAddedEvent;
  }

  /**
   * Update decision properties.
   * Only active decisions can be updated.
   */
  update(
    title?: string,
    context?: string,
    rationale?: string,
    alternatives?: string[],
    consequences?: string
  ): DecisionUpdatedEvent {
    this.ensureNotRemoved();
    // State validation
    if (this.state.status !== DecisionStatus.ACTIVE) {
      throw new Error(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
    }

    // Input validation (only validate provided fields)
    if (title) ValidationRuleSet.ensure(title, TITLE_RULES);
    if (context) ValidationRuleSet.ensure(context, CONTEXT_RULES);
    if (rationale) ValidationRuleSet.ensure(rationale, RATIONALE_RULES);
    if (alternatives) ValidationRuleSet.ensure(alternatives, ALTERNATIVES_RULES);
    if (consequences) ValidationRuleSet.ensure(consequences, CONSEQUENCES_RULES);

    return this.makeEvent(
      DecisionEventType.UPDATED,
      {
        title,
        context,
        rationale,
        alternatives,
        consequences
      },
      Decision.apply
    ) as DecisionUpdatedEvent;
  }

  /**
   * Reverse a decision.
   * Marks the decision as no longer applicable.
   */
  reverse(reason: string): DecisionReversedEvent {
    this.ensureNotRemoved();
    // State validation - can only reverse active decisions
    if (this.state.status === DecisionStatus.REVERSED) {
      throw new Error(DecisionErrorMessages.ALREADY_REVERSED);
    }
    if (this.state.status === DecisionStatus.SUPERSEDED) {
      throw new Error(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
    }

    // Input validation
    ValidationRuleSet.ensure(reason, REASON_RULES);

    // Create and return event
    return this.makeEvent(
      DecisionEventType.REVERSED,
      {
        reason: reason.trim(),
        reversedAt: new Date().toISOString() as ISO8601
      },
      Decision.apply
    ) as DecisionReversedEvent;
  }

  /**
   * Mark decision as superseded by a newer decision.
   */
  supersede(supersededBy: UUID): DecisionSupersededEvent {
    this.ensureNotRemoved();
    // State validation
    if (this.state.status === DecisionStatus.SUPERSEDED) {
      throw new Error(DecisionErrorMessages.ALREADY_SUPERSEDED);
    }
    if (this.state.status === DecisionStatus.REVERSED) {
      throw new Error(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
    }

    // Input validation
    ValidationRuleSet.ensure(supersededBy, SUPERSEDED_BY_RULES);

    return this.makeEvent(
      DecisionEventType.SUPERSEDED,
      { supersededBy },
      Decision.apply
    ) as DecisionSupersededEvent;
  }

  /**
   * Irreversibly remove a decision while preserving its historical properties.
   */
  remove(): DecisionRemovedEvent {
    if (this.state.status === DecisionStatus.REMOVED) {
      throw new Error(DecisionErrorMessages.ALREADY_REMOVED);
    }

    return this.makeEvent<DecisionRemovedEvent>(
      DecisionEventType.REMOVED,
      { status: DecisionStatus.REMOVED },
      Decision.apply
    );
  }

  private ensureNotRemoved(): void {
    if (this.state.status === DecisionStatus.REMOVED) {
      throw new Error(DecisionErrorMessages.CANNOT_MODIFY_REMOVED);
    }
  }

  /** Restore a reversed or superseded decision back to active status. */
  restore(reason: string): DecisionRestoredEvent {
    this.ensureNotRemoved();
    if (this.state.status === DecisionStatus.ACTIVE) {
      throw new Error(DecisionErrorMessages.ALREADY_ACTIVE);
    }

    ValidationRuleSet.ensure(reason, REASON_RULES);

    return this.makeEvent(
      DecisionEventType.RESTORED,
      {
        reason: reason.trim(),
        restoredAt: new Date().toISOString() as ISO8601
      },
      Decision.apply
    ) as DecisionRestoredEvent;
  }
}
