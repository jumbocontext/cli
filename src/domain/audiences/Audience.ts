/**
 * Audience Aggregate
 *
 * Domain aggregate representing a target audience for the project.
 * Captures who the project serves and their priority level.
 */

import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID, BaseEvent } from "../BaseEvent.js";
import { AudienceId } from "./AudienceId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  AudienceEvent,
  AudienceAddedEvent,
  AudienceUpdatedEvent,
  AudienceRemovedEvent,
} from "./EventIndex.js";
import {
  AudienceEventType,
  AudienceErrorMessages,
  AudiencePriorityType,
} from "./Constants.js";
import { NAME_RULES } from "./rules/NameRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { PRIORITY_RULES } from "./rules/PriorityRules.js";

/**
 * Domain state: business properties + aggregate metadata
 */
export interface AudienceState extends AggregateState {
  id: AudienceId; // Aggregate identity
  name: string; // Required: audience name
  description: string; // Required: who they are
  priority: AudiencePriorityType; // Required: primary/secondary/tertiary
  isRemoved: boolean; // Track removal state
  version: number; // Aggregate version for event sourcing
}

export class Audience extends BaseAggregate<AudienceState, AudienceEvent> {
  private constructor(state: AudienceState) {
    super(state); // Call BaseAggregate constructor
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: AudienceState, event: AudienceEvent): void {
    switch (event.type) {
      case AudienceEventType.ADDED: {
        const e = event as AudienceAddedEvent;
        state.name = e.payload.name;
        state.description = e.payload.description;
        state.priority = e.payload.priority;
        state.version = e.version;
        break;
      }
      case AudienceEventType.UPDATED: {
        const e = event as AudienceUpdatedEvent;
        // Update only changed fields
        if (e.payload.name !== undefined) state.name = e.payload.name;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.priority !== undefined)
          state.priority = e.payload.priority;
        state.version = e.version;
        break;
      }
      case AudienceEventType.REMOVED: {
        state.isRemoved = true;
        state.version = event.version;
        break;
      }
    }
  }

  /**
   * Creates a new Audience aggregate.
   * Use this when starting a new aggregate that will emit its first event.
   */
  static create(id: AudienceId = AudienceId.create()): Audience {
    const state: AudienceState = {
      id,
      name: "",
      description: "",
      priority: "primary",
      isRemoved: false,
      version: 0,
    };
    return new Audience(state);
  }

  /**
   * Rehydrates an Audience aggregate from event history.
   * Use this when loading an aggregate from the event store.
   */
  static rehydrate(id: UUID, history: AudienceEvent[]): Audience {
    const state: AudienceState = {
      id: AudienceId.fromLegacy(id),
      name: "",
      description: "",
      priority: "primary",
      isRemoved: false,
      version: 0,
    };

    for (const event of history) {
      Audience.apply(state, event);
    }

    return new Audience(state);
  }

  /**
   * Adds a new audience to the project.
   * This is the first event in the Audience aggregate's lifecycle.
   *
   * @param name - Audience name (required)
   * @param description - Who they are and what they do (required)
   * @param priority - Priority level: primary, secondary, or tertiary (required)
   * @returns AudienceAddedEvent event
   * @throws Error if audience already exists or validation fails
   */
  add(
    name: string,
    description: string,
    priority: AudiencePriorityType,
  ): AudienceAddedEvent {
    // State validation - can't add twice
    if (this.state.version > 0) {
      throw new Error(AudienceErrorMessages.ALREADY_EXISTS);
    }

    // Input validation using rule pattern
    ValidationRuleSet.ensure(name, NAME_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    ValidationRuleSet.ensure(priority, PRIORITY_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent<AudienceAddedEvent>(
      AudienceEventType.ADDED,
      {
        name,
        description,
        priority,
      },
      Audience.apply,
    );
  }

  /**
   * Updates an existing audience's properties.
   * Supports partial updates - only changed fields are included in the event.
   *
   * @param name - Updated audience name (optional)
   * @param description - Updated description (optional)
   * @param priority - Updated priority level (optional)
   * @returns AudienceUpdatedEvent event
   * @throws Error if audience doesn't exist, no changes detected, or validation fails
   */
  update(
    name?: string,
    description?: string,
    priority?: AudiencePriorityType,
  ): AudienceUpdatedEvent {
    // State validation - must exist before updating
    if (this.state.version === 0) {
      throw new Error(AudienceErrorMessages.NOT_FOUND);
    }

    // Validate inputs if provided
    if (name !== undefined) ValidationRuleSet.ensure(name, NAME_RULES);
    if (description !== undefined)
      ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    if (priority !== undefined)
      ValidationRuleSet.ensure(priority, PRIORITY_RULES);

    // Check if any changes detected
    const hasChanges =
      (name !== undefined && name !== this.state.name) ||
      (description !== undefined && description !== this.state.description) ||
      (priority !== undefined && priority !== this.state.priority);

    if (!hasChanges) {
      throw new Error(AudienceErrorMessages.NO_CHANGES);
    }

    // Build payload with only changed fields
    const payload: {
      name?: string;
      description?: string;
      priority?: AudiencePriorityType;
    } = {};

    if (name !== undefined && name !== this.state.name) {
      payload.name = name;
    }
    if (description !== undefined && description !== this.state.description) {
      payload.description = description;
    }
    if (priority !== undefined && priority !== this.state.priority) {
      payload.priority = priority;
    }

    // Use BaseAggregate.makeEvent
    return this.makeEvent<AudienceUpdatedEvent>(
      AudienceEventType.UPDATED,
      payload,
      Audience.apply,
    );
  }

  /**
   * Removes an audience from the project.
   * Marks the audience as removed (soft-delete).
   *
   * @param reason - Optional reason for removal
   * @returns AudienceRemovedEvent event
   * @throws Error if audience doesn't exist or is already removed
   */
  remove(reason?: string): AudienceRemovedEvent {
    // State validation - must exist before removing
    if (this.state.version === 0) {
      throw new Error(AudienceErrorMessages.NOT_FOUND);
    }

    // State validation - can't remove twice
    if (this.state.isRemoved) {
      throw new Error(AudienceErrorMessages.ALREADY_REMOVED);
    }

    // Create and return event
    return this.makeEvent<AudienceRemovedEvent>(
      AudienceEventType.REMOVED,
      {
        name: this.state.name,
        removedReason: reason,
      },
      Audience.apply,
    );
  }
}
