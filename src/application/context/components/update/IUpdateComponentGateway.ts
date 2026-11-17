import { UpdateComponentRequest } from "./UpdateComponentRequest.js";
import { UpdateComponentResponse } from "./UpdateComponentResponse.js";

export interface IUpdateComponentGateway {
  updateComponent(
    request: UpdateComponentRequest,
  ): Promise<UpdateComponentResponse>;
}
