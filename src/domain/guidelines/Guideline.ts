/**
 * Guideline Aggregate
 *
 * Domain aggregate representing an execution guideline.
 * Guidelines define rules for testing, coding style, process, communication, etc.
 */

import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { GuidelineId } from "./GuidelineId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  GuidelineEvent,
  GuidelineAddedEvent,
  GuidelineUpdatedEvent,
  GuidelineRemovedEvent,
} from "./EventIndex.js";
import {
  GuidelineEventType,
  GuidelineCategoryValue,
  GuidelineErrorMessages,
} from "./Constants.js";
import { CATEGORY_RULES } from "./rules/CategoryRules.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { RATIONALE_RULES } from "./rules/RationaleRules.js";
import { EXAMPLES_RULES } from "./rules/ExamplesRules.js";

/**
 * Domain state: business properties + aggregate metadata
 */
export interface GuidelineState extends AggregateState {
  id: GuidelineId;
  category: GuidelineCategoryValue;
  title: string;
  description: string;
  rationale: string;
  examples: string[];
  isRemoved: boolean; // Track removal state
  version: number;
}

export class Guideline extends BaseAggregate<GuidelineState, GuidelineEvent> {
  private constructor(state: GuidelineState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: GuidelineState, event: GuidelineEvent): void {
    switch (event.type) {
      case GuidelineEventType.ADDED: {
        const e = event as GuidelineAddedEvent;
        state.category = e.payload.category;
        state.title = e.payload.title;
        state.description = e.payload.description;
        state.rationale = e.payload.rationale;
        state.examples = e.payload.examples;
        state.version = e.version;
        break;
      }
      case GuidelineEventType.UPDATED: {
        const e = event as GuidelineUpdatedEvent;
        if (e.payload.category !== undefined)
          state.category = e.payload.category;
        if (e.payload.title !== undefined) state.title = e.payload.title;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.rationale !== undefined)
          state.rationale = e.payload.rationale;
        if (e.payload.examples !== undefined)
          state.examples = e.payload.examples;
        state.version = e.version;
        break;
      }
      case GuidelineEventType.REMOVED: {
        state.isRemoved = true;
        state.version = event.version;
        break;
      }
    }
  }

  /**
   * Creates a new Guideline aggregate.
   * Use this when starting a new aggregate that will emit its first event.
   */
  static create(id: GuidelineId = GuidelineId.create()): Guideline {
    const state: GuidelineState = {
      id,
      category: "other" as GuidelineCategoryValue,
      title: "",
      description: "",
      rationale: "",
      examples: [],
      isRemoved: false, // Default to not removed
      version: 0,
    };
    return new Guideline(state);
  }

  /**
   * Rehydrates a Guideline aggregate from event history.
   * Use this when loading an aggregate from the event store.
   */
  static rehydrate(id: UUID, history: GuidelineEvent[]): Guideline {
    const state: GuidelineState = {
      id: GuidelineId.fromLegacy(id),
      category: "other" as GuidelineCategoryValue,
      title: "",
      description: "",
      rationale: "",
      examples: [],
      isRemoved: false,
      version: 0,
    };

    for (const event of history) {
      Guideline.apply(state, event);
    }

    return new Guideline(state);
  }

  /**
   * Adds a new guideline to the project.
   * This is the first event in the Guideline aggregate's lifecycle.
   *
   * @param category - Guideline category (required)
   * @param title - Guideline title (required)
   * @param description - Detailed description (required)
   * @param rationale - Why this guideline is important (required)
   * @param examples - Example file paths demonstrating the guideline (optional)
   * @returns GuidelineAdded event
   * @throws Error if validation fails
   */
  add(
    category: GuidelineCategoryValue,
    title: string,
    description: string,
    rationale: string,
    examples?: string[],
  ): GuidelineAddedEvent {
    // Input validation using rule pattern (synchronous validations)
    ValidationRuleSet.ensure(category, CATEGORY_RULES);
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    ValidationRuleSet.ensure(rationale, RATIONALE_RULES);

    // Validate examples (max count, path length only - file existence checked at read time)
    if (examples && examples.length > 0) {
      ValidationRuleSet.ensure(examples, EXAMPLES_RULES);
    }

    // Use BaseAggregate.makeEvent
    return this.makeEvent<GuidelineAddedEvent>(
      GuidelineEventType.ADDED,
      {
        category,
        title,
        description,
        rationale,
        examples: examples || [],
      },
      Guideline.apply,
    );
  }

  /**
   * Updates the guideline with new values.
   * Supports partial updates - only provided fields are changed.
   *
   * @param changes - Object containing fields to update
   * @returns GuidelineUpdated event
   * @throws Error if no changes provided or validation fails
   */
  update(changes: {
    category?: GuidelineCategoryValue;
    title?: string;
    description?: string;
    rationale?: string;
    examples?: string[];
  }): GuidelineUpdatedEvent {
    // Ensure at least one change is provided
    if (Object.keys(changes).length === 0) {
      throw new Error(GuidelineErrorMessages.NO_CHANGES);
    }

    // Validate each provided field (synchronous validations)
    if (changes.category !== undefined) {
      ValidationRuleSet.ensure(changes.category, CATEGORY_RULES);
    }
    if (changes.title !== undefined) {
      ValidationRuleSet.ensure(changes.title, TITLE_RULES);
    }
    if (changes.description !== undefined) {
      ValidationRuleSet.ensure(changes.description, DESCRIPTION_RULES);
    }
    if (changes.rationale !== undefined) {
      ValidationRuleSet.ensure(changes.rationale, RATIONALE_RULES);
    }

    // Validate examples (max count, path length only - file existence checked at read time)
    if (changes.examples !== undefined && changes.examples.length > 0) {
      ValidationRuleSet.ensure(changes.examples, EXAMPLES_RULES);
    }

    // Create event with only changed fields
    return this.makeEvent<GuidelineUpdatedEvent>(
      GuidelineEventType.UPDATED,
      changes,
      Guideline.apply,
    );
  }

  /**
   * Mark this guideline as removed.
   * @param reason Optional reason for removal
   * @returns GuidelineRemoved event
   * @throws Error if guideline is already removed
   */
  remove(reason?: string): GuidelineRemovedEvent {
    // State validation
    if (this.state.isRemoved) {
      throw new Error(GuidelineErrorMessages.ALREADY_REMOVED);
    }

    // Create and return event (no input validation needed for optional reason)
    return this.makeEvent<GuidelineRemovedEvent>(
      GuidelineEventType.REMOVED,
      {
        removedAt:
          new Date().toISOString() as import("../BaseEvent.js").ISO8601,
        reason: reason || undefined,
      },
      Guideline.apply,
    );
  }
}
