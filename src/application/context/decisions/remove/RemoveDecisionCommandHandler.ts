import type { RemoveDecisionCommand } from "./RemoveDecisionCommand.js";
import type { IDecisionRemovedEventWriter } from "./IDecisionRemovedEventWriter.js";
import type { IDecisionViewReader } from "../get/IDecisionViewReader.js";
import type { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import { DecisionErrorMessages, formatErrorMessage } from "../../../../domain/decisions/Constants.js";

export class RemoveDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionRemovedEventWriter,
    private readonly reader: IDecisionViewReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: RemoveDecisionCommand): Promise<{ decisionId: string }> {
    const [view] = await this.reader.findByIds([command.decisionId]);
    if (!view) {
      throw new Error(formatErrorMessage(DecisionErrorMessages.DECISION_NOT_FOUND, { id: command.decisionId }));
    }

    const history = await this.eventWriter.readStream(command.decisionId);
    const decision = Decision.rehydrate(command.decisionId, history);
    const event = decision.remove();
    await this.eventWriter.append(event);
    await this.eventBus.publish(event);
    return { decisionId: command.decisionId };
  }
}
