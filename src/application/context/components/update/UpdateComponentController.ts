import { UpdateComponentRequest } from "./UpdateComponentRequest.js";
import { UpdateComponentResponse } from "./UpdateComponentResponse.js";
import { IUpdateComponentGateway } from "./IUpdateComponentGateway.js";

export class UpdateComponentController {
  constructor(private readonly gateway: IUpdateComponentGateway) {}

  async handle(
    request: UpdateComponentRequest,
  ): Promise<UpdateComponentResponse> {
    return this.gateway.updateComponent(request);
  }
}
