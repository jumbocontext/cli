import { DefineArchitectureRequest } from "./DefineArchitectureRequest.js";
import { DefineArchitectureResponse } from "./DefineArchitectureResponse.js";

export interface IDefineArchitectureGateway {
  defineArchitecture(
    request: DefineArchitectureRequest,
  ): Promise<DefineArchitectureResponse>;
}
