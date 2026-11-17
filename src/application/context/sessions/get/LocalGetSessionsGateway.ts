import { IGetSessionsGateway } from "./IGetSessionsGateway.js";
import { GetSessionsRequest } from "./GetSessionsRequest.js";
import { GetSessionsResponse } from "./GetSessionsResponse.js";
import { ISessionViewReader } from "./ISessionViewReader.js";

export class LocalGetSessionsGateway implements IGetSessionsGateway {
  constructor(private readonly sessionViewReader: ISessionViewReader) {}

  async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
    const sessions = await this.sessionViewReader.findAll(request.status);
    return { sessions };
  }
}
