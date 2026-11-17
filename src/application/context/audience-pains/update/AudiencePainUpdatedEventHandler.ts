import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudiencePainUpdatedEvent } from "../../../../domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import { IAudiencePainUpdatedProjector } from "./IAudiencePainUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for AudiencePainUpdatedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience pain is updated. Subscribes to AudiencePainUpdatedEvent via event bus.
 */
export class AudiencePainUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IAudiencePainUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainUpdatedEvent = event as AudiencePainUpdatedEvent;
    await this.projector.applyAudiencePainUpdated(audiencePainUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.PAIN,
      audiencePainUpdatedEvent.aggregateId,
      "audience pain was updated",
    );
  }
}
