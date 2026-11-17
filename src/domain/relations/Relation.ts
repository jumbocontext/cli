import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { RelationId } from "./RelationId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import { RelationAddedEvent } from "./add/RelationAddedEvent.js";
import { RelationDeactivatedEvent } from "./deactivate/RelationDeactivatedEvent.js";
import { RelationReactivatedEvent } from "./reactivate/RelationReactivatedEvent.js";
import { RelationRemovedEvent } from "./remove/RelationRemovedEvent.js";
import {
  RelationEventType,
  EntityTypeValue,
  RelationStrengthValue,
  RelationStatus,
  RelationStatusValue,
  RelationErrorMessages,
  formatErrorMessage,
} from "./Constants.js";
import { ENTITY_TYPE_RULES, ENTITY_ID_RULES } from "./rules/EntityTypeRules.js";
import { RELATION_TYPE_RULES } from "./rules/RelationTypeRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";

// Re-export RelationEvent type for convenience
export type RelationEvent =
  | RelationAddedEvent
  | RelationDeactivatedEvent
  | RelationReactivatedEvent
  | RelationRemovedEvent;

export interface RelationState extends AggregateState {
  id: RelationId;
  fromEntityType: EntityTypeValue;
  fromEntityId: string;
  toEntityType: EntityTypeValue;
  toEntityId: string;
  relationType: string;
  strength: RelationStrengthValue | null;
  description: string;
  status: RelationStatusValue;
  version: number;
}

export class Relation extends BaseAggregate<RelationState, RelationEvent> {
  private constructor(state: RelationState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: RelationState, event: RelationEvent): void {
    switch (event.type) {
      case RelationEventType.ADDED: {
        const e = event as RelationAddedEvent;
        state.fromEntityType = e.payload.fromEntityType;
        state.fromEntityId = e.payload.fromEntityId;
        state.toEntityType = e.payload.toEntityType;
        state.toEntityId = e.payload.toEntityId;
        state.relationType = e.payload.relationType;
        state.strength = e.payload.strength;
        state.description = e.payload.description;
        state.status = RelationStatus.ACTIVE;
        state.version = e.version;
        break;
      }
      case RelationEventType.REMOVED: {
        state.status = RelationStatus.REMOVED;
        state.version = event.version;
        break;
      }
      case RelationEventType.DEACTIVATED: {
        state.status = RelationStatus.DEACTIVATED;
        state.version = event.version;
        break;
      }
      case RelationEventType.REACTIVATED: {
        state.status = RelationStatus.ACTIVE;
        state.version = event.version;
        break;
      }
    }
  }

  static create(id: RelationId = RelationId.create()): Relation {
    const state: RelationState = {
      id,
      fromEntityType: "" as EntityTypeValue,
      fromEntityId: "",
      toEntityType: "" as EntityTypeValue,
      toEntityId: "",
      relationType: "",
      strength: null,
      description: "",
      status: RelationStatus.ACTIVE,
      version: 0,
    };
    return new Relation(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Relation from event store.
   */
  static rehydrate(id: UUID, history: RelationEvent[]): Relation {
    const state: RelationState = {
      id: RelationId.fromLegacy(id),
      fromEntityType: "" as EntityTypeValue,
      fromEntityId: "",
      toEntityType: "" as EntityTypeValue,
      toEntityId: "",
      relationType: "",
      strength: null,
      description: "",
      status: RelationStatus.ACTIVE,
      version: 0,
    };

    for (const event of history) {
      Relation.apply(state, event);
    }

    return new Relation(state);
  }

  add(
    fromEntityType: EntityTypeValue,
    fromEntityId: string,
    toEntityType: EntityTypeValue,
    toEntityId: string,
    relationType: string,
    description: string,
    strength?: RelationStrengthValue,
  ): RelationAddedEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(fromEntityType, ENTITY_TYPE_RULES("from"));
    ValidationRuleSet.ensure(fromEntityId, ENTITY_ID_RULES("from"));
    ValidationRuleSet.ensure(toEntityType, ENTITY_TYPE_RULES("to"));
    ValidationRuleSet.ensure(toEntityId, ENTITY_ID_RULES("to"));
    ValidationRuleSet.ensure(relationType, RELATION_TYPE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);

    // Business rule: cannot relate entity to itself
    if (fromEntityType === toEntityType && fromEntityId === toEntityId) {
      throw new Error(RelationErrorMessages.SELF_REFERENCE);
    }

    // Use BaseAggregate.makeEvent
    return this.makeEvent<RelationAddedEvent>(
      RelationEventType.ADDED,
      {
        fromEntityType,
        fromEntityId,
        toEntityType,
        toEntityId,
        relationType,
        strength: strength || null,
        description,
      },
      Relation.apply,
    );
  }

  remove(reason?: string): RelationRemovedEvent {
    // State validation - ensure relation hasn't already been removed
    if (this.state.status === RelationStatus.REMOVED) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_ALREADY_REMOVED, {
          relationId: this.state.id,
        }),
      );
    }

    // Create and return event
    return this.makeEvent<RelationRemovedEvent>(
      RelationEventType.REMOVED,
      {
        fromEntityType: this.state.fromEntityType,
        fromEntityId: this.state.fromEntityId,
        toEntityType: this.state.toEntityType,
        toEntityId: this.state.toEntityId,
        relationType: this.state.relationType,
        reason: reason,
      },
      Relation.apply,
    );
  }

  deactivate(reason: string): RelationDeactivatedEvent {
    if (this.state.status !== RelationStatus.ACTIVE) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_NOT_ACTIVE, {
          relationId: this.state.id,
        }),
      );
    }

    return this.makeEvent<RelationDeactivatedEvent>(
      RelationEventType.DEACTIVATED,
      {
        reason,
        deactivatedAt: new Date().toISOString(),
      },
      Relation.apply,
    );
  }

  reactivate(reason: string): RelationReactivatedEvent {
    if (this.state.status !== RelationStatus.DEACTIVATED) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_NOT_DEACTIVATED, {
          relationId: this.state.id,
        }),
      );
    }

    return this.makeEvent<RelationReactivatedEvent>(
      RelationEventType.REACTIVATED,
      {
        reason,
        reactivatedAt: new Date().toISOString(),
      },
      Relation.apply,
    );
  }
}
