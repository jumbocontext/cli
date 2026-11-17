import { IRemoveInvariantGateway } from "./IRemoveInvariantGateway.js";
import { RemoveInvariantRequest } from "./RemoveInvariantRequest.js";
import { RemoveInvariantResponse } from "./RemoveInvariantResponse.js";
import { RemoveInvariantCommandHandler } from "./RemoveInvariantCommandHandler.js";
import { IInvariantRemoveReader } from "./IInvariantRemoveReader.js";

export class LocalRemoveInvariantGateway implements IRemoveInvariantGateway {
  constructor(
    private readonly commandHandler: RemoveInvariantCommandHandler,
    private readonly invariantReader: IInvariantRemoveReader,
  ) {}

  async removeInvariant(
    request: RemoveInvariantRequest,
  ): Promise<RemoveInvariantResponse> {
    // Fetch view before removal for display
    const view = await this.invariantReader.findById(request.invariantId);

    // Execute command
    await this.commandHandler.execute({
      invariantId: request.invariantId,
    });

    return {
      invariantId: request.invariantId,
      title: view?.title || request.invariantId,
    };
  }
}
