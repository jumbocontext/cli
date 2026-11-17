import { UpdateDependencyRequest } from "./UpdateDependencyRequest.js";
import { UpdateDependencyResponse } from "./UpdateDependencyResponse.js";

export interface IUpdateDependencyGateway {
  updateDependency(
    request: UpdateDependencyRequest,
  ): Promise<UpdateDependencyResponse>;
}
