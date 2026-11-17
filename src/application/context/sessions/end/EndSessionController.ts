import { EndSessionRequest } from "./EndSessionRequest.js";
import { EndSessionResponse } from "./EndSessionResponse.js";
import { IEndSessionGateway } from "./IEndSessionGateway.js";

export class EndSessionController {
  constructor(private readonly gateway: IEndSessionGateway) {}

  async handle(request: EndSessionRequest): Promise<EndSessionResponse> {
    return this.gateway.endSession(request);
  }
}
