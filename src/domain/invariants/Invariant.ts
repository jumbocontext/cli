/**
 * Invariant Aggregate
 *
 * Domain aggregate representing a non-negotiable requirement or boundary.
 * Invariants ensure all work respects technical, business, or process constraints.
 */

import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID, ISO8601 } from "../BaseEvent.js";
import { InvariantId } from "./InvariantId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  InvariantEvent,
  InvariantAddedEvent,
  InvariantUpdatedEvent,
  InvariantRemovedEvent,
} from "./EventIndex.js";
import { InvariantEventType, InvariantErrorMessages } from "./Constants.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { RATIONALE_RULES } from "./rules/RationaleRules.js";

/**
 * Domain state: business properties + aggregate metadata
 */
export interface InvariantState extends AggregateState {
  id: InvariantId;
  title: string;
  description: string;
  rationale: string | null;
  version: number;
}

export class Invariant extends BaseAggregate<InvariantState, InvariantEvent> {
  private constructor(state: InvariantState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: InvariantState, event: InvariantEvent): void {
    switch (event.type) {
      case InvariantEventType.ADDED: {
        const e = event as InvariantAddedEvent;
        state.title = e.payload.title;
        state.description = e.payload.description;
        state.rationale = e.payload.rationale;
        state.version = e.version;
        break;
      }
      case InvariantEventType.UPDATED: {
        const e = event as InvariantUpdatedEvent;
        if (e.payload.title !== undefined) state.title = e.payload.title;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.rationale !== undefined)
          state.rationale = e.payload.rationale;
        state.version = e.version;
        break;
      }
      case InvariantEventType.REMOVED: {
        state.version = event.version;
        break;
      }
    }
  }

  /**
   * Creates a new Invariant aggregate.
   * Use this when starting a new aggregate that will emit its first event.
   */
  static create(id: InvariantId = InvariantId.create()): Invariant {
    const state: InvariantState = {
      id,
      title: "",
      description: "",
      rationale: null,
      version: 0,
    };
    return new Invariant(state);
  }

  /**
   * Rehydrates an Invariant aggregate from event history.
   * Use this when loading an aggregate from the event store.
   */
  static rehydrate(id: UUID, history: InvariantEvent[]): Invariant {
    const state: InvariantState = {
      id: InvariantId.fromLegacy(id),
      title: "",
      description: "",
      rationale: null,
      version: 0,
    };

    for (const event of history) {
      Invariant.apply(state, event);
    }

    return new Invariant(state);
  }

  /**
   * Adds a new invariant to the project.
   * This is the first event in the Invariant aggregate's lifecycle.
   *
   * @param title - Invariant title (required)
   * @param description - Detailed description (required)
   * @param rationale - Why this invariant is non-negotiable (optional)
   * @returns InvariantAdded event
   * @throws Error if validation fails
   */
  add(
    title: string,
    description: string,
    rationale?: string,
  ): InvariantAddedEvent {
    // Input validation using rule pattern
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    if (rationale) ValidationRuleSet.ensure(rationale, RATIONALE_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent<InvariantAddedEvent>(
      InvariantEventType.ADDED,
      {
        title,
        description,
        rationale: rationale || null,
      },
      Invariant.apply,
    );
  }

  /**
   * Updates invariant properties.
   * At least one field must be provided.
   * Only provided fields are updated.
   *
   * @param updates - Object with optional fields to update
   * @returns InvariantUpdated event
   * @throws Error if no fields provided or validation fails
   */
  update(updates: {
    title?: string;
    description?: string;
    rationale?: string | null;
  }): InvariantUpdatedEvent {
    // Validate at least one field provided
    const hasUpdates =
      updates.title !== undefined ||
      updates.description !== undefined ||
      updates.rationale !== undefined;

    if (!hasUpdates) {
      throw new Error(InvariantErrorMessages.NO_CHANGES_PROVIDED);
    }

    // Validate provided fields
    if (updates.title !== undefined) {
      ValidationRuleSet.ensure(updates.title, TITLE_RULES);
    }
    if (updates.description !== undefined) {
      ValidationRuleSet.ensure(updates.description, DESCRIPTION_RULES);
    }
    if (updates.rationale !== undefined && updates.rationale !== null) {
      ValidationRuleSet.ensure(updates.rationale, RATIONALE_RULES);
    }
    // Create event with only provided fields
    const payload: {
      title?: string;
      description?: string;
      rationale?: string | null;
    } = {};

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined)
      payload.description = updates.description;
    if (updates.rationale !== undefined) payload.rationale = updates.rationale;

    return this.makeEvent<InvariantUpdatedEvent>(
      InvariantEventType.UPDATED,
      payload,
      Invariant.apply,
    );
  }

  /**
   * Marks this invariant as removed.
   * No validation needed - removal is always allowed.
   *
   * @returns InvariantRemoved event
   */
  remove(): InvariantRemovedEvent {
    // Note: No state validation needed - we allow removing at any time
    // The command handler should verify existence before calling this

    return this.makeEvent<InvariantRemovedEvent>(
      InvariantEventType.REMOVED,
      {
        removedAt: new Date().toISOString() as ISO8601,
      },
      Invariant.apply,
    );
  }
}
