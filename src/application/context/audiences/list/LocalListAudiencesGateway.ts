import { IListAudiencesGateway } from "./IListAudiencesGateway.js";
import { ListAudiencesRequest } from "./ListAudiencesRequest.js";
import { ListAudiencesResponse } from "./ListAudiencesResponse.js";
import { IAudienceContextReader } from "../query/IAudienceContextReader.js";

export class LocalListAudiencesGateway implements IListAudiencesGateway {
  constructor(private readonly audienceContextReader: IAudienceContextReader) {}

  async listAudiences(
    _request: ListAudiencesRequest,
  ): Promise<ListAudiencesResponse> {
    const audiences = await this.audienceContextReader.findAllActive();
    return { audiences };
  }
}
