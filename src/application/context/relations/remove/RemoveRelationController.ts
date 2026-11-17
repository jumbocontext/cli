import { RemoveRelationRequest } from "./RemoveRelationRequest.js";
import { RemoveRelationResponse } from "./RemoveRelationResponse.js";
import { IRemoveRelationGateway } from "./IRemoveRelationGateway.js";

export class RemoveRelationController {
  constructor(private readonly gateway: IRemoveRelationGateway) {}

  async handle(
    request: RemoveRelationRequest,
  ): Promise<RemoveRelationResponse> {
    return this.gateway.removeRelation(request);
  }
}
