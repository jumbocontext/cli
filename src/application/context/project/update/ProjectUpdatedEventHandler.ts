import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ProjectUpdatedEvent } from "../../../../domain/project/update/ProjectUpdatedEvent.js";
import { IProjectUpdatedProjector } from "./IProjectUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for ProjectUpdated event.
 *
 * Application layer handler that orchestrates projection updates
 * when a project is updated. Subscribes to ProjectUpdated via event bus.
 */
export class ProjectUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IProjectUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const projectUpdatedEvent = event as ProjectUpdatedEvent;
    await this.projector.applyProjectUpdated(projectUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.PROJECT,
      projectUpdatedEvent.aggregateId,
      "project was updated",
    );
  }
}
