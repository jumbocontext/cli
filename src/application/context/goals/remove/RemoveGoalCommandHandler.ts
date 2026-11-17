import { RemoveGoalCommand } from "./RemoveGoalCommand.js";
import { IGoalRemovedEventWriter } from "./IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "./IGoalRemovedEventReader.js";
import { IGoalRemoveReader } from "./IGoalRemoveReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";

/**
 * Handles removal of a goal from tracking.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class RemoveGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalRemovedEventWriter,
    private readonly eventReader: IGoalRemovedEventReader,
    private readonly goalReader: IGoalRemoveReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: RemoveGoalCommand): Promise<{ goalId: string }> {
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

    // 3. Domain logic produces event (validates state)
    const event = goal.remove();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
