import { RemoveComponentRequest } from "./RemoveComponentRequest.js";
import { RemoveComponentResponse } from "./RemoveComponentResponse.js";
import { IRemoveComponentGateway } from "./IRemoveComponentGateway.js";

export class RemoveComponentController {
  constructor(private readonly gateway: IRemoveComponentGateway) {}

  async handle(
    request: RemoveComponentRequest,
  ): Promise<RemoveComponentResponse> {
    return this.gateway.removeComponent(request);
  }
}
