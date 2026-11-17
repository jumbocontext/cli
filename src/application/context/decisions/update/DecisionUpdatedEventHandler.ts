import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionUpdatedEvent } from "../../../../domain/decisions/update/DecisionUpdatedEvent.js";
import { IDecisionUpdatedProjector } from "./IDecisionUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionUpdated events.
 * Subscribes to events via event bus.
 */
export class DecisionUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IDecisionUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionUpdatedEvent = event as DecisionUpdatedEvent;
    await this.projector.applyDecisionUpdated(decisionUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.DECISION,
      decisionUpdatedEvent.aggregateId,
      "decision was updated",
    );
  }
}
