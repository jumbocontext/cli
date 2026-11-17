import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentRemovedEvent } from "../../../../domain/components/remove/ComponentRemovedEvent.js";
import { IComponentRemovedProjector } from "./IComponentRemovedProjector.js";
import { RelationPruningCascade } from "../../relations/prune/RelationPruningCascade.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class ComponentRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IComponentRemovedProjector,
    private readonly relationPruningCascade: RelationPruningCascade,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentRemovedEvent = event as ComponentRemovedEvent;
    await this.projector.applyComponentRemoved(componentRemovedEvent);
    await this.relationPruningCascade.execute(
      EntityType.COMPONENT,
      componentRemovedEvent.aggregateId,
      `Automatically pruned because component ${componentRemovedEvent.aggregateId} was removed`,
    );
  }
}
