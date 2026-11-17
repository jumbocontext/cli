import { RemoveInvariantRequest } from "./RemoveInvariantRequest.js";
import { RemoveInvariantResponse } from "./RemoveInvariantResponse.js";
import { IRemoveInvariantGateway } from "./IRemoveInvariantGateway.js";

export class RemoveInvariantController {
  constructor(private readonly gateway: IRemoveInvariantGateway) {}

  async handle(
    request: RemoveInvariantRequest,
  ): Promise<RemoveInvariantResponse> {
    return this.gateway.removeInvariant(request);
  }
}
