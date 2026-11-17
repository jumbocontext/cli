import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentUpdatedEvent } from "../../../../domain/components/update/ComponentUpdatedEvent.js";
import { IComponentUpdatedProjector } from "./IComponentUpdatedProjector.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentUpdatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentUpdatedProjector,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentUpdatedEvent = event as ComponentUpdatedEvent;
    await this.projector.applyComponentUpdated(componentUpdatedEvent);
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.COMPONENT,
      componentUpdatedEvent.aggregateId,
      "component was updated",
    );
  }
}
