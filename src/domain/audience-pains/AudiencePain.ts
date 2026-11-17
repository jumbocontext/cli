import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { AudiencePainId } from "./AudiencePainId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  AudiencePainEvent,
  AudiencePainAddedEvent,
  AudiencePainUpdatedEvent,
} from "./EventIndex.js";
import {
  AudiencePainEventType,
  AudiencePainErrorMessages,
  AudiencePainStatus,
  AudiencePainStatusType,
} from "./Constants.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";

export interface AudiencePainState extends AggregateState {
  id: AudiencePainId;
  title: string;
  description: string;
  status: AudiencePainStatusType;
  version: number;
}

export class AudiencePain extends BaseAggregate<
  AudiencePainState,
  AudiencePainEvent
> {
  private constructor(state: AudiencePainState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: AudiencePainState, event: AudiencePainEvent): void {
    switch (event.type) {
      case AudiencePainEventType.ADDED: {
        const e = event as AudiencePainAddedEvent;
        state.title = e.payload.title;
        state.description = e.payload.description;
        state.status = AudiencePainStatus.ACTIVE;
        state.version = e.version;
        break;
      }
      case AudiencePainEventType.UPDATED: {
        const e = event as AudiencePainUpdatedEvent;
        if (e.payload.title !== undefined) {
          state.title = e.payload.title;
        }
        if (e.payload.description !== undefined) {
          state.description = e.payload.description;
        }
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: AudiencePainId = AudiencePainId.create()): AudiencePain {
    const state: AudiencePainState = {
      id,
      title: "",
      description: "",
      status: AudiencePainStatus.ACTIVE,
      version: 0,
    };
    return new AudiencePain(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild AudiencePain from event store.
   */
  static rehydrate(id: UUID, history: AudiencePainEvent[]): AudiencePain {
    const state: AudiencePainState = {
      id: AudiencePainId.fromLegacy(id),
      title: "",
      description: "",
      status: AudiencePainStatus.ACTIVE,
      version: 0,
    };

    for (const event of history) {
      AudiencePain.apply(state, event);
    }

    return new AudiencePain(state);
  }

  add(title: string, description: string): AudiencePainAddedEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent<AudiencePainAddedEvent>(
      AudiencePainEventType.ADDED,
      { title, description },
      AudiencePain.apply,
    );
  }

  /**
   * Update pain details (title and/or description).
   * At least one field must be provided.
   */
  update(title?: string, description?: string): AudiencePainUpdatedEvent {
    // Business rule: must provide at least one change
    if (title === undefined && description === undefined) {
      throw new Error(AudiencePainErrorMessages.NO_CHANGES);
    }

    // Validate provided fields
    if (title !== undefined) {
      ValidationRuleSet.ensure(title, TITLE_RULES);
    }
    if (description !== undefined) {
      ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    }

    return this.makeEvent<AudiencePainUpdatedEvent>(
      AudiencePainEventType.UPDATED,
      {
        title,
        description,
      },
      AudiencePain.apply,
    );
  }
}
