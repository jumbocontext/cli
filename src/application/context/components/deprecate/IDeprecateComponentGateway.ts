import { DeprecateComponentRequest } from "./DeprecateComponentRequest.js";
import { DeprecateComponentResponse } from "./DeprecateComponentResponse.js";

export interface IDeprecateComponentGateway {
  deprecateComponent(
    request: DeprecateComponentRequest,
  ): Promise<DeprecateComponentResponse>;
}
