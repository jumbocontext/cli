import { GetArchitectureRequest } from "./GetArchitectureRequest.js";
import { GetArchitectureResponse } from "./GetArchitectureResponse.js";
import { IGetArchitectureGateway } from "./IGetArchitectureGateway.js";

export class GetArchitectureController {
  constructor(private readonly gateway: IGetArchitectureGateway) {}

  async handle(
    request: GetArchitectureRequest,
  ): Promise<GetArchitectureResponse> {
    return this.gateway.getArchitecture(request);
  }
}
