import { UndeprecateComponentRequest } from "./UndeprecateComponentRequest.js";
import { UndeprecateComponentResponse } from "./UndeprecateComponentResponse.js";
import { IUndeprecateComponentGateway } from "./IUndeprecateComponentGateway.js";

export class UndeprecateComponentController {
  constructor(private readonly gateway: IUndeprecateComponentGateway) {}

  async handle(
    request: UndeprecateComponentRequest,
  ): Promise<UndeprecateComponentResponse> {
    return this.gateway.undeprecateComponent(request);
  }
}
