import { ShowGoalCommand } from "./ShowGoalCommand.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles showing goal details.
 * Pure query operation - no state changes, no events.
 * Returns ContextualGoalView for presentation layer.
 */
export class ShowGoalCommandHandler {
  constructor(
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async execute(command: ShowGoalCommand): Promise<ContextualGoalView> {
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
