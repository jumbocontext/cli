import { IGoalContextAssembler } from "./IGoalContextAssembler.js";
import { ContextualGoalView } from "./ContextualGoalView.js";

/**
 * GoalContextQueryHandler - Query handler for goal context retrieval
 *
 * Retrieves comprehensive relation-based context for a goal by delegating to IGoalContextAssembler.
 *
 * Returns ContextualGoalView (goal + context relations, no enrichment).
 * Command handlers return this directly to the presentation layer.
 *
 * This maintains clean separation of concerns per CQRS:
 * - Query layer: retrieves data
 * - Presentation layer: renders for specific use cases
 */
export class GoalContextQueryHandler {
  constructor(private readonly assembler: IGoalContextAssembler) {}

  /**
   * Execute the query to get goal context
   *
   * @param goalId - ID of the goal to get context for
   * @returns ContextualGoalView with goal and all related entities
   * @throws Error if goal not found
   */
  async execute(goalId: string): Promise<ContextualGoalView> {
    const result = await this.assembler.assembleContextForGoal(goalId);

    if (!result) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    return result;
  }
}
