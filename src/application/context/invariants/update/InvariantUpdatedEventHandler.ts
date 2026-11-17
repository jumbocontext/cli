import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { InvariantUpdatedEvent } from "../../../../domain/invariants/update/InvariantUpdatedEvent.js";
import { IInvariantUpdatedProjector } from "./IInvariantUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for InvariantUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when an invariant is updated. Subscribes to InvariantUpdatedEvent via event bus.
 */
export class InvariantUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IInvariantUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const invariantUpdatedEvent = event as InvariantUpdatedEvent;
    await this.projector.applyInvariantUpdated(invariantUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.INVARIANT,
      invariantUpdatedEvent.aggregateId,
      "invariant was updated",
    );
  }
}
