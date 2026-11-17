import { ReverseDecisionCommand } from "./ReverseDecisionCommand.js";
import { IDecisionReversedEventWriter } from "./IDecisionReversedEventWriter.js";
import { IDecisionReverseReader } from "./IDecisionReverseReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import {
  DecisionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/decisions/Constants.js";

/**
 * Handles reversing of an architectural decision.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class ReverseDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionReversedEventWriter,
    private readonly reader: IDecisionReverseReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: ReverseDecisionCommand,
  ): Promise<{ decisionId: string }> {
    // 1. Check decision exists (query projection for fast check)
    const view = await this.reader.findById(command.decisionId);
    if (!view) {
      throw new Error(
        formatErrorMessage(DecisionErrorMessages.DECISION_NOT_FOUND, {
          id: command.decisionId,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventWriter.readStream(command.decisionId);
    const decision = Decision.rehydrate(command.decisionId, history);

    // 3. Domain logic produces event (validates state)
    const event = decision.reverse(command.reason);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { decisionId: command.decisionId };
  }
}
