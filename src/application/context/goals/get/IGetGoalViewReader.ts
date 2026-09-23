import { GoalView } from "../GoalView.js";

export interface IGetGoalViewReader {
  findById(goalId: string): Promise<GoalView | null>;
}
