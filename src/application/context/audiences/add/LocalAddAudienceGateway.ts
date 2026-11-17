import { IAddAudienceGateway } from "./IAddAudienceGateway.js";
import { AddAudienceRequest } from "./AddAudienceRequest.js";
import { AddAudienceResponse } from "./AddAudienceResponse.js";
import { AddAudienceCommandHandler } from "./AddAudienceCommandHandler.js";

export class LocalAddAudienceGateway implements IAddAudienceGateway {
  constructor(private readonly commandHandler: AddAudienceCommandHandler) {}

  async addAudience(request: AddAudienceRequest): Promise<AddAudienceResponse> {
    const result = await this.commandHandler.execute({
      name: request.name,
      description: request.description,
      priority: request.priority,
    });

    return {
      audienceId: result.audienceId,
      name: request.name,
      description: request.description,
      priority: request.priority,
    };
  }
}
