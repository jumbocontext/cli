import { UpdateArchitectureRequest } from "./UpdateArchitectureRequest.js";
import { UpdateArchitectureResponse } from "./UpdateArchitectureResponse.js";
import { IUpdateArchitectureGateway } from "./IUpdateArchitectureGateway.js";

export class UpdateArchitectureController {
  constructor(private readonly gateway: IUpdateArchitectureGateway) {}

  async handle(
    request: UpdateArchitectureRequest,
  ): Promise<UpdateArchitectureResponse> {
    return this.gateway.updateArchitecture(request);
  }
}
