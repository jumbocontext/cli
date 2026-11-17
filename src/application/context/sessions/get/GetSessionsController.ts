import { GetSessionsRequest } from "./GetSessionsRequest.js";
import { GetSessionsResponse } from "./GetSessionsResponse.js";
import { IGetSessionsGateway } from "./IGetSessionsGateway.js";

export class GetSessionsController {
  constructor(private readonly gateway: IGetSessionsGateway) {}

  async handle(request: GetSessionsRequest): Promise<GetSessionsResponse> {
    return this.gateway.getSessions(request);
  }
}
