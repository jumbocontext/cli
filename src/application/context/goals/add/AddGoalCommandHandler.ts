import { AddGoalCommand } from "./AddGoalCommand.js";
import { IGoalAddedEventWriter } from "./IGoalAddedEventWriter.js";
import { IGoalUpdatedEventWriter } from "../update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../update/IGoalUpdatedEventReader.js";
import { IGoalUpdateReader } from "../update/IGoalUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";

/**
 * Command handler for AddGoalCommand.
 * Orchestrates the creation of a new goal aggregate and event publication.
 *
 * Handler owns ID generation as part of orchestration (Clean Architecture).
 * Also handles goal chaining via nextGoalId and previousGoalId.
 */
export class AddGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalAddedEventWriter,
    private readonly eventBus: IEventBus,
    // Optional dependencies for goal chaining (updating previous goal)
    private readonly updateEventWriter?: IGoalUpdatedEventWriter,
    private readonly updateEventReader?: IGoalUpdatedEventReader,
    private readonly goalReader?: IGoalUpdateReader,
  ) {}

  async execute(command: AddGoalCommand): Promise<{ goalId: string }> {
    // Create new aggregate
    const goal = Goal.create();
    const goalId = goal.snapshot.id;

    // Domain logic produces event
    const event = goal.add(
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

    // Persist event to file store
    await this.eventWriter.append(event);

    // Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // Handle previousGoalId: update the previous goal's nextGoalId to point to this new goal
    if (command.previousGoalId) {
      await this.updatePreviousGoalNextGoalId(command.previousGoalId, goalId);
    }

    return { goalId };
  }

  /**
   * Updates the previous goal's nextGoalId to point to the new goal.
   * This creates a chain: previousGoal -> newGoal
   */
  private async updatePreviousGoalNextGoalId(
    previousGoalId: string,
    newGoalId: string,
  ): Promise<void> {
    if (
      !this.updateEventWriter ||
      !this.updateEventReader ||
      !this.goalReader
    ) {
      throw new Error("Goal chaining dependencies not configured");
    }

    // Check if previous goal exists
    const existingGoal = await this.goalReader.findById(previousGoalId);
    if (!existingGoal) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.NOT_FOUND, {
          goalId: previousGoalId,
        }),
      );
    }

    // Rehydrate the previous goal aggregate from event history
    const history = await this.updateEventReader.readStream(previousGoalId);
    const previousGoal = Goal.rehydrate(previousGoalId, history);

    // Update the previous goal's nextGoalId
    const updateEvent = previousGoal.update(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      newGoalId,
    );

    // Persist the update event
    await this.updateEventWriter.append(updateEvent);

    // Publish the update event
    await this.eventBus.publish(updateEvent);
  }
}
