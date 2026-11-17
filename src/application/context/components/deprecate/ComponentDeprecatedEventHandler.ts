import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentDeprecatedEvent } from "../../../../domain/components/deprecate/ComponentDeprecatedEvent.js";
import { IComponentDeprecatedProjector } from "./IComponentDeprecatedProjector.js";
import { RelationDeactivationCascade } from "../../relations/deactivate/RelationDeactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentDeprecatedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentDeprecatedProjector,
    private readonly relationDeactivationCascade: RelationDeactivationCascade,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentDeprecatedEvent = event as ComponentDeprecatedEvent;
    await this.projector.applyComponentDeprecated(componentDeprecatedEvent);
    const deprecationReason =
      componentDeprecatedEvent.payload.reason ?? "no reason provided";
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.COMPONENT,
      componentDeprecatedEvent.aggregateId,
      `component was deprecated: ${deprecationReason}`,
    );
    await this.relationDeactivationCascade.execute(
      EntityType.COMPONENT,
      componentDeprecatedEvent.aggregateId,
      `Automatically deactivated because component ${componentDeprecatedEvent.aggregateId} was deprecated: ${deprecationReason}`,
    );
  }
}
