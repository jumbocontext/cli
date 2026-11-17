import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DependencyUpdatedEvent } from "../../../../domain/dependencies/update/DependencyUpdatedEvent.js";
import { IDependencyUpdatedProjector } from "./IDependencyUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Event handler for DependencyUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a dependency is updated. Subscribes to DependencyUpdatedEvent via event bus.
 */
export class DependencyUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IDependencyUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const dependencyUpdatedEvent = event as DependencyUpdatedEvent;
    await this.projector.applyDependencyUpdated(dependencyUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.DEPENDENCY,
      dependencyUpdatedEvent.aggregateId,
      "dependency was updated",
    );
  }
}
