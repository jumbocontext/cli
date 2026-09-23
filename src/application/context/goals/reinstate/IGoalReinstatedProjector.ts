import { GoalReinstatedEvent } from "../../../../domain/goals/reinstate/GoalReinstatedEvent.js";

export interface IGoalReinstatedProjector {
  applyGoalReinstated(event: GoalReinstatedEvent): Promise<void>;
}
