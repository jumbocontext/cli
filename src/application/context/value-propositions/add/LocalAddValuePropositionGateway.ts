import { IAddValuePropositionGateway } from "./IAddValuePropositionGateway.js";
import { AddValuePropositionRequest } from "./AddValuePropositionRequest.js";
import { AddValuePropositionResponse } from "./AddValuePropositionResponse.js";
import { AddValuePropositionCommandHandler } from "./AddValuePropositionCommandHandler.js";
import { IValuePropositionUpdateReader } from "../update/IValuePropositionUpdateReader.js";

export class LocalAddValuePropositionGateway implements IAddValuePropositionGateway {
  constructor(
    private readonly commandHandler: AddValuePropositionCommandHandler,
    private readonly viewReader: IValuePropositionUpdateReader,
  ) {}

  async addValueProposition(
    request: AddValuePropositionRequest,
  ): Promise<AddValuePropositionResponse> {
    const result = await this.commandHandler.execute({
      title: request.title,
      description: request.description,
      benefit: request.benefit,
      measurableOutcome: request.measurableOutcome,
    });

    const view = await this.viewReader.findById(result.valuePropositionId);

    return {
      valuePropositionId: result.valuePropositionId,
      title: view?.title || request.title,
      measurableOutcome: request.measurableOutcome,
    };
  }
}
