import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentEventType } from "../../../../domain/components/Constants.js";
import { DecisionEventType } from "../../../../domain/decisions/Constants.js";
import { DependencyEventType } from "../../../../domain/dependencies/Constants.js";
import { GuidelineEventType } from "../../../../domain/guidelines/Constants.js";
import { InvariantEventType } from "../../../../domain/invariants/Constants.js";
import {
  EntityType,
  EntityTypeValue,
} from "../../../../domain/relations/Constants.js";
import { IRelationDiscoveryGoalRegistrar } from "./IRelationDiscoveryGoalRegistrar.js";

const EVENT_TYPE_TO_ENTITY_TYPE: Record<string, EntityTypeValue> = {
  [ComponentEventType.ADDED]: EntityType.COMPONENT,
  [DecisionEventType.ADDED]: EntityType.DECISION,
  [DependencyEventType.ADDED]: EntityType.DEPENDENCY,
  [GuidelineEventType.ADDED]: EntityType.GUIDELINE,
  [InvariantEventType.ADDED]: EntityType.INVARIANT,
};

/**
 * Subscribes to entity-created events and delegates to the relation discovery
 * registrar, which creates a goal for a future session to find and register
 * valid relations to the newly created entity.
 */
export class RelationDiscoveryEventHandler implements IEventHandler {
  constructor(
    private readonly relationDiscoveryGoalRegistrar: IRelationDiscoveryGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const entityType = EVENT_TYPE_TO_ENTITY_TYPE[event.type];
    if (!entityType) {
      return;
    }
    await this.relationDiscoveryGoalRegistrar.execute(
      entityType,
      event.aggregateId,
    );
  }
}
