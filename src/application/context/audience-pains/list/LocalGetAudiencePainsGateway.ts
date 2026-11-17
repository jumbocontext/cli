import { IGetAudiencePainsGateway } from "./IGetAudiencePainsGateway.js";
import { GetAudiencePainsRequest } from "./GetAudiencePainsRequest.js";
import { GetAudiencePainsResponse } from "./GetAudiencePainsResponse.js";
import { IAudiencePainContextReader } from "../query/IAudiencePainContextReader.js";

export class LocalGetAudiencePainsGateway implements IGetAudiencePainsGateway {
  constructor(
    private readonly audiencePainContextReader: IAudiencePainContextReader,
  ) {}

  async getAudiencePains(
    _request: GetAudiencePainsRequest,
  ): Promise<GetAudiencePainsResponse> {
    const pains = await this.audiencePainContextReader.findAllActive();
    return { pains };
  }
}
