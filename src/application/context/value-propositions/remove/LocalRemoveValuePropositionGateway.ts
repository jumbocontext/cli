import { IRemoveValuePropositionGateway } from "./IRemoveValuePropositionGateway.js";
import { RemoveValuePropositionRequest } from "./RemoveValuePropositionRequest.js";
import { RemoveValuePropositionResponse } from "./RemoveValuePropositionResponse.js";
import { RemoveValuePropositionCommandHandler } from "./RemoveValuePropositionCommandHandler.js";
import { IValuePropositionRemoveReader } from "./IValuePropositionRemoveReader.js";
import {
  ValuePropositionErrorMessages,
  formatErrorMessage,
} from "../../../../domain/value-propositions/Constants.js";

export class LocalRemoveValuePropositionGateway implements IRemoveValuePropositionGateway {
  constructor(
    private readonly commandHandler: RemoveValuePropositionCommandHandler,
    private readonly reader: IValuePropositionRemoveReader,
  ) {}

  async removeValueProposition(
    request: RemoveValuePropositionRequest,
  ): Promise<RemoveValuePropositionResponse> {
    const view = await this.reader.findById(request.valuePropositionId);
    if (!view) {
      throw new Error(
        formatErrorMessage(ValuePropositionErrorMessages.NOT_FOUND, {
          id: request.valuePropositionId,
        }),
      );
    }

    await this.commandHandler.execute({
      valuePropositionId: request.valuePropositionId,
    });

    return {
      valuePropositionId: request.valuePropositionId,
      title: view.title,
    };
  }
}
