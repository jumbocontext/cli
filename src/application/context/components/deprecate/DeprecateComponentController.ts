import { DeprecateComponentRequest } from "./DeprecateComponentRequest.js";
import { DeprecateComponentResponse } from "./DeprecateComponentResponse.js";
import { IDeprecateComponentGateway } from "./IDeprecateComponentGateway.js";

export class DeprecateComponentController {
  constructor(private readonly gateway: IDeprecateComponentGateway) {}

  async handle(
    request: DeprecateComponentRequest,
  ): Promise<DeprecateComponentResponse> {
    return this.gateway.deprecateComponent(request);
  }
}
