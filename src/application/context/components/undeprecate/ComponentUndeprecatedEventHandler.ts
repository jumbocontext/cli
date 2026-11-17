import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentUndeprecatedEvent } from "../../../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { IComponentUndeprecatedProjector } from "./IComponentUndeprecatedProjector.js";
import { RelationReactivationCascade } from "../../relations/reactivate/RelationReactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentUndeprecatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentUndeprecatedProjector,
    private readonly relationReactivationCascade: RelationReactivationCascade,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentUndeprecatedEvent = event as ComponentUndeprecatedEvent;
    await this.projector.applyComponentUndeprecated(componentUndeprecatedEvent);
    await this.relationReactivationCascade.execute(
      EntityType.COMPONENT,
      componentUndeprecatedEvent.aggregateId,
      `Automatically reactivated because component ${componentUndeprecatedEvent.aggregateId} was undeprecated: ${componentUndeprecatedEvent.payload.reason}`,
    );
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.COMPONENT,
      componentUndeprecatedEvent.aggregateId,
      `component was undeprecated: ${componentUndeprecatedEvent.payload.reason}`,
    );
  }
}
