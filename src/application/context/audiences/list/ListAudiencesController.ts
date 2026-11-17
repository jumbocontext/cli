import { ListAudiencesRequest } from "./ListAudiencesRequest.js";
import { ListAudiencesResponse } from "./ListAudiencesResponse.js";
import { IListAudiencesGateway } from "./IListAudiencesGateway.js";

export class ListAudiencesController {
  constructor(private readonly gateway: IListAudiencesGateway) {}

  async handle(request: ListAudiencesRequest): Promise<ListAudiencesResponse> {
    return this.gateway.listAudiences(request);
  }
}
