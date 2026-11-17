import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { IStartSessionGateway } from "./IStartSessionGateway.js";

export class SessionStartController {
  constructor(private readonly gateway: IStartSessionGateway) {}

  async handle(request: SessionStartRequest): Promise<SessionStartResponse> {
    return this.gateway.startSession(request);
  }
}
