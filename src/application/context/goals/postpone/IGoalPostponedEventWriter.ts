import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IGoalPostponedEventWriter {
  append(event: BaseEvent): Promise<AppendResult>;
}
