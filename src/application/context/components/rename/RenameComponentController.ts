import { RenameComponentRequest } from "./RenameComponentRequest.js";
import { RenameComponentResponse } from "./RenameComponentResponse.js";
import { IRenameComponentGateway } from "./IRenameComponentGateway.js";

export class RenameComponentController {
  constructor(private readonly gateway: IRenameComponentGateway) {}

  async handle(
    request: RenameComponentRequest,
  ): Promise<RenameComponentResponse> {
    return this.gateway.renameComponent(request);
  }
}
