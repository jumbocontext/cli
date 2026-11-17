import { IAddInvariantGateway } from "./IAddInvariantGateway.js";
import { AddInvariantRequest } from "./AddInvariantRequest.js";
import { AddInvariantResponse } from "./AddInvariantResponse.js";
import { AddInvariantCommandHandler } from "./AddInvariantCommandHandler.js";

export class LocalAddInvariantGateway implements IAddInvariantGateway {
  constructor(private readonly commandHandler: AddInvariantCommandHandler) {}

  async addInvariant(
    request: AddInvariantRequest,
  ): Promise<AddInvariantResponse> {
    const result = await this.commandHandler.execute({
      title: request.title,
      description: request.description,
      rationale: request.rationale,
    });

    return {
      invariantId: result.invariantId,
    };
  }
}
