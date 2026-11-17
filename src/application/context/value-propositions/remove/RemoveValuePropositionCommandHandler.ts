import { RemoveValuePropositionCommand } from "./RemoveValuePropositionCommand.js";
import { IValuePropositionRemovedEventWriter } from "./IValuePropositionRemovedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IValuePropositionRemoveReader } from "./IValuePropositionRemoveReader.js";
import { ValueProposition } from "../../../../domain/value-propositions/ValueProposition.js";
import {
  ValuePropositionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/value-propositions/Constants.js";

/**
 * Handler for removing a value proposition
 * Publishes events via event bus for projection updates
 */
export class RemoveValuePropositionCommandHandler {
  constructor(
    private readonly eventWriter: IValuePropositionRemovedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IValuePropositionRemoveReader,
  ) {}

  async execute(
    command: RemoveValuePropositionCommand,
  ): Promise<{ valuePropositionId: string; title: string }> {
    // 1. Check if value proposition exists
    const existingView = await this.reader.findById(command.valuePropositionId);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(ValuePropositionErrorMessages.NOT_FOUND, {
          id: command.valuePropositionId,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(
      command.valuePropositionId,
    );
    const valueProposition = ValueProposition.rehydrate(
      command.valuePropositionId,
      history,
    );

    // 3. Domain logic produces event
    const event = valueProposition.remove();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return {
      valuePropositionId: command.valuePropositionId,
      title: existingView.title,
    };
  }
}
