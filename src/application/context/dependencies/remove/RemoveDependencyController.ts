import { RemoveDependencyRequest } from "./RemoveDependencyRequest.js";
import { RemoveDependencyResponse } from "./RemoveDependencyResponse.js";
import { IRemoveDependencyGateway } from "./IRemoveDependencyGateway.js";

export class RemoveDependencyController {
  constructor(private readonly gateway: IRemoveDependencyGateway) {}

  async handle(
    request: RemoveDependencyRequest,
  ): Promise<RemoveDependencyResponse> {
    return this.gateway.removeDependency(request);
  }
}
