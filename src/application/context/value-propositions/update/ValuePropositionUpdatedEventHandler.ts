import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ValuePropositionUpdatedEvent } from "../../../../domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { IValuePropositionUpdatedProjector } from "./IValuePropositionUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for ValuePropositionUpdatedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is updated. Subscribes to ValuePropositionUpdatedEvent via event bus.
 */
export class ValuePropositionUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IValuePropositionUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionUpdatedEvent = event as ValuePropositionUpdatedEvent;
    await this.projector.applyValuePropositionUpdated(
      valuePropositionUpdatedEvent,
    );
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.VALUE,
      valuePropositionUpdatedEvent.aggregateId,
      "value proposition was updated",
    );
  }
}
