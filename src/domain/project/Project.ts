/**
 * Project Aggregate
 *
 * Domain aggregate representing the project being managed by Jumbo.
 * Captures the core project knowledge: name and purpose.
 */

import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { ProjectId } from "./ProjectId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  ProjectEvent,
  ProjectInitializedEvent,
  ProjectUpdatedEvent,
} from "./EventIndex.js";
import { ProjectEventType, ProjectErrorMessages } from "./Constants.js";
import { NAME_RULES } from "./rules/NameRules.js";
import { PURPOSE_RULES } from "./rules/PurposeRules.js";

/**
 * Domain state: business properties + aggregate metadata
 */
export interface ProjectState extends AggregateState {
  id: ProjectId; // Aggregate identity
  name: string; // Required: project name
  purpose: string | null; // Optional: high-level what
  version: number; // Aggregate version for event sourcing
}

export class Project extends BaseAggregate<ProjectState, ProjectEvent> {
  private constructor(state: ProjectState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: ProjectState, event: ProjectEvent): void {
    switch (event.type) {
      case ProjectEventType.INITIALIZED: {
        const e = event as ProjectInitializedEvent;
        state.name = e.payload.name;
        state.purpose = e.payload.purpose;
        state.version = e.version;
        break;
      }
      case ProjectEventType.UPDATED: {
        const e = event as ProjectUpdatedEvent;
        if (e.payload.purpose !== undefined) state.purpose = e.payload.purpose;
        state.version = e.version;
        break;
      }
    }
  }

  /**
   * Creates a new Project aggregate.
   * Use this when starting a new aggregate that will emit its first event.
   */
  static create(id: ProjectId = ProjectId.create()): Project {
    const state: ProjectState = {
      id,
      name: "",
      purpose: null,
      version: 0,
    };
    return new Project(state);
  }

  /**
   * Rehydrates a Project aggregate from event history.
   * Use this when loading an aggregate from the event store.
   */
  static rehydrate(id: UUID, history: ProjectEvent[]): Project {
    const state: ProjectState = {
      id: ProjectId.fromLegacy(id),
      name: "",
      purpose: null,
      version: 0,
    };

    for (const event of history) {
      Project.apply(state, event);
    }

    return new Project(state);
  }

  /**
   * Initializes the project with core details.
   * This is the first event in the Project aggregate's lifecycle.
   *
   * @param name - Project name (required)
   * @param purpose - High-level project purpose (optional)
   * @returns ProjectInitialized event
   * @throws Error if project is already initialized or validation fails
   */
  initialize(name: string, purpose?: string): ProjectInitializedEvent {
    // State validation - can't initialize twice
    if (this.state.version > 0) {
      throw new Error(ProjectErrorMessages.ALREADY_INITIALIZED);
    }

    // Input validation using rule pattern
    ValidationRuleSet.ensure(name, NAME_RULES);
    if (purpose) ValidationRuleSet.ensure(purpose, PURPOSE_RULES);

    // Use BaseAggregate.makeEvent (no need to reimplement!)
    return this.makeEvent<ProjectInitializedEvent>(
      ProjectEventType.INITIALIZED,
      {
        name,
        purpose: purpose || null,
      },
      Project.apply, // Pass projection's apply function
    );
  }

  /**
   * Updates the project's metadata.
   * Only changed fields are included in the resulting event.
   * Name cannot be updated after initialization (immutable).
   *
   * @param purpose - Updated project purpose (optional)
   * @returns ProjectUpdated event or null if no changes
   * @throws Error if project is not initialized or validation fails
   */
  update(purpose?: string | null): ProjectUpdatedEvent | null {
    // State validation - must be initialized
    if (this.state.version === 0) {
      throw new Error(ProjectErrorMessages.NOT_INITIALIZED);
    }

    // Input validation using existing rules
    if (purpose !== undefined && purpose !== null) {
      ValidationRuleSet.ensure(purpose, PURPOSE_RULES);
    }

    // Check if anything actually changed
    const changes: {
      purpose?: string | null;
    } = {};

    if (purpose !== undefined && purpose !== this.state.purpose) {
      changes.purpose = purpose;
    }

    // No changes? Return null (idempotent)
    if (Object.keys(changes).length === 0) {
      return null;
    }

    // Create and return event with only changed fields
    return this.makeEvent<ProjectUpdatedEvent>(
      ProjectEventType.UPDATED,
      changes,
      Project.apply,
    );
  }

  // No need for makeEvent() - inherited from BaseAggregate!
  // No need for snapshot getter - inherited from BaseAggregate!
}
