import { UpdateGoalCommand } from "./UpdateGoalCommand.js";
import { IGoalUpdatedEventWriter } from "./IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "./IGoalUpdatedEventReader.js";
import { IGoalUpdateReader } from "./IGoalUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";

/**
 * Application layer command handler for updating a goal.
 * Orchestrates: load aggregate - domain logic - persist event - publish to bus
 */
export class UpdateGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalUpdatedEventWriter,
    private readonly eventReader: IGoalUpdatedEventReader,
    private readonly goalReader: IGoalUpdateReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: UpdateGoalCommand): Promise<{ goalId: string }> {
    // 1. Check if goal exists
    const existingGoal = await this.goalReader.findById(command.goalId);
    if (!existingGoal) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.NOT_FOUND, {
          goalId: command.goalId,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);

    // 3. Domain logic produces event
    const event = goal.update(
      command.title,
      command.objective,
      command.successCriteria,
      command.scopeIn,
      command.scopeOut,
      command.nextGoalId,
      command.prerequisiteGoals,
      command.branch,
      command.worktree,
    );

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections update asynchronously)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
