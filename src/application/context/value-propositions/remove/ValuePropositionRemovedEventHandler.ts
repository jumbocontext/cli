import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ValuePropositionRemovedEvent } from "../../../../domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { IValuePropositionRemovedProjector } from "./IValuePropositionRemovedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for ValuePropositionRemovedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is removed. Subscribes to ValuePropositionRemovedEvent via event bus.
 */
export class ValuePropositionRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IValuePropositionRemovedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionRemovedEvent = event as ValuePropositionRemovedEvent;
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.VALUE,
      valuePropositionRemovedEvent.aggregateId,
      "value proposition was removed",
    );
    await this.projector.applyValuePropositionRemoved(
      valuePropositionRemovedEvent,
    );
  }
}
