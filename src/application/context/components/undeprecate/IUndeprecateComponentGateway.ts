import { UndeprecateComponentRequest } from "./UndeprecateComponentRequest.js";
import { UndeprecateComponentResponse } from "./UndeprecateComponentResponse.js";

export interface IUndeprecateComponentGateway {
  undeprecateComponent(
    request: UndeprecateComponentRequest,
  ): Promise<UndeprecateComponentResponse>;
}
