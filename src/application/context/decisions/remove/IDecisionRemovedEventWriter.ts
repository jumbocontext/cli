import type { DecisionRemovedEvent } from "../../../../domain/decisions/remove/DecisionRemovedEvent.js";
import type { DecisionEvent } from "../../../../domain/decisions/EventIndex.js";
import type { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionRemovedEventWriter {
  append(event: DecisionRemovedEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<DecisionEvent[]>;
}
