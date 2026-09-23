import { GoalPostponedEvent } from "../../../../domain/goals/postpone/GoalPostponedEvent.js";

export interface IGoalPostponedProjector {
  applyGoalPostponed(event: GoalPostponedEvent): Promise<void>;
}
