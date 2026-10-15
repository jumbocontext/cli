import type { IEventHandler } from "../../../messaging/IEventHandler.js";
import type { BaseEvent } from "../../../../domain/BaseEvent.js";
import type { DecisionRemovedEvent } from "../../../../domain/decisions/remove/DecisionRemovedEvent.js";
import type { IDecisionRemovedProjector } from "./IDecisionRemovedProjector.js";
import type { RelationPruningCascade } from "../../relations/prune/RelationPruningCascade.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class DecisionRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IDecisionRemovedProjector,
    private readonly relationPruningCascade: Pick<RelationPruningCascade, "execute">
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionRemovedEvent = event as DecisionRemovedEvent;
    await this.projector.applyDecisionRemoved(decisionRemovedEvent);
    await this.relationPruningCascade.execute(
      EntityType.DECISION,
      event.aggregateId,
      `Automatically pruned because decision ${event.aggregateId} was removed`
    );
  }
}
