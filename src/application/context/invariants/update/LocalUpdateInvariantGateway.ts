import { IUpdateInvariantGateway } from "./IUpdateInvariantGateway.js";
import { UpdateInvariantRequest } from "./UpdateInvariantRequest.js";
import { UpdateInvariantResponse } from "./UpdateInvariantResponse.js";
import { UpdateInvariantCommandHandler } from "./UpdateInvariantCommandHandler.js";
import { IInvariantUpdateReader } from "./IInvariantUpdateReader.js";

export class LocalUpdateInvariantGateway implements IUpdateInvariantGateway {
  constructor(
    private readonly commandHandler: UpdateInvariantCommandHandler,
    private readonly invariantReader: IInvariantUpdateReader,
  ) {}

  async updateInvariant(
    request: UpdateInvariantRequest,
  ): Promise<UpdateInvariantResponse> {
    // 1. Delegate write-side orchestration to command handler
    await this.commandHandler.execute({
      invariantId: request.invariantId,
      title: request.title,
      description: request.description,
      rationale: request.rationale,
    });

    // 2. Fetch updated view for response
    const view = await this.invariantReader.findById(request.invariantId);

    // 3. Build list of updated fields
    const updatedFields: string[] = [];
    if (request.title !== undefined) updatedFields.push("title");
    if (request.description !== undefined) updatedFields.push("description");
    if (request.rationale !== undefined) updatedFields.push("rationale");

    return {
      invariantId: request.invariantId,
      updatedFields,
      ...(view ? { title: view.title, version: view.version } : {}),
    };
  }
}
