import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GuidelineUpdatedEvent } from "../../../../domain/guidelines/update/GuidelineUpdatedEvent.js";
import { IGuidelineUpdatedProjector } from "./IGuidelineUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for GuidelineUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a guideline is updated. Subscribes to GuidelineUpdatedEvent via event bus.
 */
export class GuidelineUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IGuidelineUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const guidelineUpdatedEvent = event as GuidelineUpdatedEvent;
    await this.projector.applyGuidelineUpdated(guidelineUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.GUIDELINE,
      guidelineUpdatedEvent.aggregateId,
      "guideline was updated",
    );
  }
}
