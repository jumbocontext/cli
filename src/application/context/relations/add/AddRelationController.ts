import { AddRelationRequest } from "./AddRelationRequest.js";
import { AddRelationResponse } from "./AddRelationResponse.js";
import { IAddRelationGateway } from "./IAddRelationGateway.js";

export class AddRelationController {
  constructor(private readonly gateway: IAddRelationGateway) {}

  async handle(request: AddRelationRequest): Promise<AddRelationResponse> {
    return this.gateway.addRelation(request);
  }
}
