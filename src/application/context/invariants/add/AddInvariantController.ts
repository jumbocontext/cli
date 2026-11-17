import { AddInvariantRequest } from "./AddInvariantRequest.js";
import { AddInvariantResponse } from "./AddInvariantResponse.js";
import { IAddInvariantGateway } from "./IAddInvariantGateway.js";

export class AddInvariantController {
  constructor(private readonly gateway: IAddInvariantGateway) {}

  async handle(request: AddInvariantRequest): Promise<AddInvariantResponse> {
    return this.gateway.addInvariant(request);
  }
}
