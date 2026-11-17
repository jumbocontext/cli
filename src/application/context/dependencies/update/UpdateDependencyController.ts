import { UpdateDependencyRequest } from "./UpdateDependencyRequest.js";
import { UpdateDependencyResponse } from "./UpdateDependencyResponse.js";
import { IUpdateDependencyGateway } from "./IUpdateDependencyGateway.js";

export class UpdateDependencyController {
  constructor(private readonly gateway: IUpdateDependencyGateway) {}

  async handle(
    request: UpdateDependencyRequest,
  ): Promise<UpdateDependencyResponse> {
    return this.gateway.updateDependency(request);
  }
}
