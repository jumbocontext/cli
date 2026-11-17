import { UpdateGoalProgressCommand } from "./UpdateGoalProgressCommand.js";
import { IGoalProgressUpdatedEventWriter } from "./IGoalProgressUpdatedEventWriter.js";
import { IGoalProgressUpdatedEventReader } from "./IGoalProgressUpdatedEventReader.js";
import { IGoalProgressUpdateReader } from "./IGoalProgressUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles updating progress on a goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Returns ContextualGoalView for presentation layer.
 */
export class UpdateGoalProgressCommandHandler {
  constructor(
    private readonly eventWriter: IGoalProgressUpdatedEventWriter,
    private readonly eventReader: IGoalProgressUpdatedEventReader,
    private readonly goalReader: IGoalProgressUpdateReader,
    private readonly eventBus: IEventBus,
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async execute(
    command: UpdateGoalProgressCommand,
  ): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: command.goalId,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);

    // 3. Domain logic produces event (validates input)
    const event = goal.updateProgress(command.taskDescription);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 6. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
