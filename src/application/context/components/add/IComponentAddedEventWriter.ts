import { ComponentAddedEvent } from "../../../../domain/components/add/ComponentAddedEvent.js";
import { ComponentUpdatedEvent } from "../../../../domain/components/update/ComponentUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IComponentAddedEventWriter {
  append(
    event: ComponentAddedEvent | ComponentUpdatedEvent,
  ): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
