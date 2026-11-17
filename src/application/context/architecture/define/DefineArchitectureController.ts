import { DefineArchitectureRequest } from "./DefineArchitectureRequest.js";
import { DefineArchitectureResponse } from "./DefineArchitectureResponse.js";
import { IDefineArchitectureGateway } from "./IDefineArchitectureGateway.js";

export class DefineArchitectureController {
  constructor(private readonly gateway: IDefineArchitectureGateway) {}

  async handle(
    request: DefineArchitectureRequest,
  ): Promise<DefineArchitectureResponse> {
    return this.gateway.defineArchitecture(request);
  }
}
