import { GetRelationsRequest } from "./GetRelationsRequest.js";
import { GetRelationsResponse } from "./GetRelationsResponse.js";
import { IGetRelationsGateway } from "./IGetRelationsGateway.js";

export class GetRelationsController {
  constructor(private readonly gateway: IGetRelationsGateway) {}

  async handle(request: GetRelationsRequest): Promise<GetRelationsResponse> {
    return this.gateway.getRelations(request);
  }
}
