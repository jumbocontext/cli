import { UpdateInvariantRequest } from "./UpdateInvariantRequest.js";
import { UpdateInvariantResponse } from "./UpdateInvariantResponse.js";
import { IUpdateInvariantGateway } from "./IUpdateInvariantGateway.js";

export class UpdateInvariantController {
  constructor(private readonly gateway: IUpdateInvariantGateway) {}

  async handle(
    request: UpdateInvariantRequest,
  ): Promise<UpdateInvariantResponse> {
    return this.gateway.updateInvariant(request);
  }
}
