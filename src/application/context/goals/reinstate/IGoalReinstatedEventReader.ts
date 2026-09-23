import { GoalEvent } from "../../../../domain/goals/EventIndex.js";

export interface IGoalReinstatedEventReader {
  readStream(streamId: string): Promise<GoalEvent[]>;
}
