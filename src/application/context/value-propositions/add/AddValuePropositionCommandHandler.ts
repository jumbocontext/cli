import { AddValuePropositionCommand } from "./AddValuePropositionCommand.js";
import { IValuePropositionAddedEventWriter } from "./IValuePropositionAddedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { ValueProposition } from "../../../../domain/value-propositions/ValueProposition.js";
import { ValuePropositionAddedEvent } from "../../../../domain/value-propositions/add/ValuePropositionAddedEvent.js";

/**
 * Handler for adding a new value proposition
 * Publishes events via event bus for projection updates
 */
export class AddValuePropositionCommandHandler {
  constructor(
    private readonly eventWriter: IValuePropositionAddedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: AddValuePropositionCommand,
  ): Promise<{ valuePropositionId: string }> {
    // 1. Create new aggregate with generated ID
    const valueProposition = ValueProposition.create();
    const valuePropositionId = valueProposition.snapshot.id;

    // 2. Domain logic produces event
    const event = valueProposition.add(
      command.title,
      command.description,
      command.benefit,
      command.measurableOutcome,
    ) as ValuePropositionAddedEvent;

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { valuePropositionId };
  }
}
