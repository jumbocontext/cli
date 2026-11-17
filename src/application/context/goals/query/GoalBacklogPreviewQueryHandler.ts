import {
  GoalStatus,
  GoalStatusType,
} from "../../../../domain/goals/Constants.js";
import { GoalView } from "../GoalView.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalBacklogPreviewItem } from "./GoalBacklogPreviewItem.js";

const STATUS_PRIORITY: ReadonlyMap<GoalStatusType, number> = new Map([
  [GoalStatus.BLOCKED, 0],
  [GoalStatus.REJECTED, 1],
  [GoalStatus.QUALIFIED, 2],
  [GoalStatus.REFINED, 3],
  [GoalStatus.TODO, 4],
  [GoalStatus.DOING, 5],
  [GoalStatus.INREVIEW, 6],
  [GoalStatus.IN_REFINEMENT, 7],
  [GoalStatus.CODIFYING, 8],
]);

export class GoalBacklogPreviewQueryHandler {
  constructor(private readonly goalStatusReader: IGoalStatusReader) {}

  async execute(limit: number): Promise<GoalBacklogPreviewItem[]> {
    const normalizedLimit = Math.max(0, Math.floor(limit));
    if (normalizedLimit === 0) {
      return [];
    }

    const goals = await this.goalStatusReader.findAll();

    return goals
      .filter((goal) => STATUS_PRIORITY.has(goal.status))
      .sort((a, b) => this.compareGoals(a, b))
      .slice(0, normalizedLimit)
      .map((goal) => ({
        goalId: goal.goalId,
        title: goal.title,
        status: goal.status,
        createdAt: goal.createdAt,
      }));
  }

  private compareGoals(a: GoalView, b: GoalView): number {
    const statusDifference =
      STATUS_PRIORITY.get(a.status)! - STATUS_PRIORITY.get(b.status)!;

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
}
