import { AddDependencyRequest } from "./AddDependencyRequest.js";
import { AddDependencyResponse } from "./AddDependencyResponse.js";
import { IAddDependencyGateway } from "./IAddDependencyGateway.js";

export class AddDependencyController {
  constructor(private readonly gateway: IAddDependencyGateway) {}

  async handle(request: AddDependencyRequest): Promise<AddDependencyResponse> {
    return this.gateway.addDependency(request);
  }
}
