import { GoalEvent } from "../../../../domain/goals/EventIndex.js";

export interface IGoalPostponedEventReader {
  readStream(streamId: string): Promise<GoalEvent[]>;
}
