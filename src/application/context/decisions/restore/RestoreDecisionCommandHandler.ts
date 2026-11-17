import { RestoreDecisionCommand } from "./RestoreDecisionCommand.js";
import { IDecisionRestoredEventWriter } from "./IDecisionRestoredEventWriter.js";
import { IDecisionRestoreReader } from "./IDecisionRestoreReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import {
  DecisionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/decisions/Constants.js";

export class RestoreDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionRestoredEventWriter,
    private readonly reader: IDecisionRestoreReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: RestoreDecisionCommand,
  ): Promise<{ decisionId: string }> {
    const view = await this.reader.findById(command.decisionId);
    if (!view) {
      throw new Error(
        formatErrorMessage(DecisionErrorMessages.DECISION_NOT_FOUND, {
          id: command.decisionId,
        }),
      );
    }

    const history = await this.eventWriter.readStream(command.decisionId);
    const decision = Decision.rehydrate(command.decisionId, history);
    const event = decision.restore(command.reason);

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);

    return { decisionId: command.decisionId };
  }
}
