import { UpdateValuePropositionCommand } from "./UpdateValuePropositionCommand.js";
import { IValuePropositionUpdatedEventWriter } from "./IValuePropositionUpdatedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IValuePropositionUpdateReader } from "./IValuePropositionUpdateReader.js";
import { ValueProposition } from "../../../../domain/value-propositions/ValueProposition.js";
import {
  ValuePropositionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/value-propositions/Constants.js";

/**
 * Handler for updating an existing value proposition
 * Rehydrates aggregate, executes update, publishes events via event bus
 */
export class UpdateValuePropositionCommandHandler {
  constructor(
    private readonly eventWriter: IValuePropositionUpdatedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IValuePropositionUpdateReader,
  ) {}

  async execute(
    command: UpdateValuePropositionCommand,
  ): Promise<{ valuePropositionId: string }> {
    // 1. Check if value proposition exists
    const existingView = await this.reader.findById(command.id);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(ValuePropositionErrorMessages.NOT_FOUND, {
          id: command.id,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(command.id);
    const valueProposition = ValueProposition.rehydrate(command.id, history);

    // 3. Domain logic produces event
    const event = valueProposition.update(
      command.title,
      command.description,
      command.benefit,
      command.measurableOutcome,
    );

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { valuePropositionId: command.id };
  }
}
