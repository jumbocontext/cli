import { UpdateArchitectureRequest } from "./UpdateArchitectureRequest.js";
import { UpdateArchitectureResponse } from "./UpdateArchitectureResponse.js";

export interface IUpdateArchitectureGateway {
  updateArchitecture(
    request: UpdateArchitectureRequest,
  ): Promise<UpdateArchitectureResponse>;
}
