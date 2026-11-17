import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudienceRemovedEvent } from "../../../../domain/audiences/remove/AudienceRemovedEvent.js";
import { IAudienceRemovedProjector } from "./IAudienceRemovedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for AudienceRemovedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience is removed. Subscribes to AudienceRemovedEvent via event bus.
 */
export class AudienceRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IAudienceRemovedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceRemovedEvent = event as AudienceRemovedEvent;
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.AUDIENCE,
      audienceRemovedEvent.aggregateId,
      "audience was removed",
    );
    await this.projector.applyAudienceRemoved(audienceRemovedEvent);
  }
}
