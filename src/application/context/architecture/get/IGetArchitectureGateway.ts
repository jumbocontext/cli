import { GetArchitectureRequest } from "./GetArchitectureRequest.js";
import { GetArchitectureResponse } from "./GetArchitectureResponse.js";

export interface IGetArchitectureGateway {
  getArchitecture(
    request: GetArchitectureRequest,
  ): Promise<GetArchitectureResponse>;
}
