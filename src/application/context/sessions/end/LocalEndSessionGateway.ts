import { IEndSessionGateway } from "./IEndSessionGateway.js";
import { EndSessionRequest } from "./EndSessionRequest.js";
import { EndSessionResponse } from "./EndSessionResponse.js";
import { EndSessionCommandHandler } from "./EndSessionCommandHandler.js";

export class LocalEndSessionGateway implements IEndSessionGateway {
  constructor(private readonly commandHandler: EndSessionCommandHandler) {}

  async endSession(request: EndSessionRequest): Promise<EndSessionResponse> {
    const result = await this.commandHandler.execute({
      focus: request.focus,
      summary: request.summary,
    });

    return {
      sessionId: result.sessionId,
      focus: request.focus,
      summary: request.summary,
    };
  }
}
