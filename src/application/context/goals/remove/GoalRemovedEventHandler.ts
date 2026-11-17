import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalRemovedEvent } from "../../../../domain/goals/remove/GoalRemovedEvent.js";
import { IGoalRemovedProjector } from "./IGoalRemovedProjector.js";
import { EntityType } from "../../../../domain/relations/Constants.js";
import { RelationPruningCascade } from "../../relations/prune/RelationPruningCascade.js";

/**
 * Event handler for GoalRemovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is removed. Subscribes to GoalRemovedEvent via event bus.
 */
export class GoalRemovedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IGoalRemovedProjector,
    private readonly relationPruningCascade: RelationPruningCascade,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalRemovedEvent = event as GoalRemovedEvent;
    await this.projector.applyGoalRemoved(goalRemovedEvent);
    await this.relationPruningCascade.execute(
      EntityType.GOAL,
      goalRemovedEvent.aggregateId,
      `Automatically pruned because goal ${goalRemovedEvent.aggregateId} was removed`,
    );
  }
}
