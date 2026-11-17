import { RemoveRelationRequest } from "./RemoveRelationRequest.js";
import { RemoveRelationResponse } from "./RemoveRelationResponse.js";

export interface IRemoveRelationGateway {
  removeRelation(
    request: RemoveRelationRequest,
  ): Promise<RemoveRelationResponse>;
}
