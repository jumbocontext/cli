import { IUpdateValuePropositionGateway } from "./IUpdateValuePropositionGateway.js";
import { UpdateValuePropositionRequest } from "./UpdateValuePropositionRequest.js";
import { UpdateValuePropositionResponse } from "./UpdateValuePropositionResponse.js";
import { UpdateValuePropositionCommandHandler } from "./UpdateValuePropositionCommandHandler.js";
import { IValuePropositionUpdateReader } from "./IValuePropositionUpdateReader.js";

export class LocalUpdateValuePropositionGateway implements IUpdateValuePropositionGateway {
  constructor(
    private readonly commandHandler: UpdateValuePropositionCommandHandler,
    private readonly viewReader: IValuePropositionUpdateReader,
  ) {}

  async updateValueProposition(
    request: UpdateValuePropositionRequest,
  ): Promise<UpdateValuePropositionResponse> {
    const result = await this.commandHandler.execute({
      id: request.id,
      title: request.title,
      description: request.description,
      benefit: request.benefit,
      measurableOutcome: request.measurableOutcome,
    });

    const updatedView = await this.viewReader.findById(
      result.valuePropositionId,
    );

    return {
      valuePropositionId: result.valuePropositionId,
      title: updatedView?.title,
      version: updatedView?.version,
    };
  }
}
