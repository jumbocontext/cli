import { SupersedeDecisionCommand } from "./SupersedeDecisionCommand.js";
import { IDecisionSupersededEventWriter } from "./IDecisionSupersededEventWriter.js";
import { IDecisionSupersedeReader } from "./IDecisionSupersedeReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import {
  DecisionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/decisions/Constants.js";

/**
 * Handles superseding of an architectural decision.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class SupersedeDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionSupersededEventWriter,
    private readonly reader: IDecisionSupersedeReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: SupersedeDecisionCommand,
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

    // 2. Verify superseding decision exists
    const supersedingView = await this.reader.findById(command.supersededBy);
    if (!supersedingView) {
      throw new Error(
        formatErrorMessage(DecisionErrorMessages.DECISION_NOT_FOUND, {
          id: command.supersededBy,
        }),
      );
    }

    // 3. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventWriter.readStream(command.decisionId);
    const decision = Decision.rehydrate(command.decisionId, history);

    // 4. Domain logic produces event (validates state)
    const event = decision.supersede(command.supersededBy);

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { decisionId: command.decisionId };
  }
}
