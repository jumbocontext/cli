import { IUpdateAudienceGateway } from "./IUpdateAudienceGateway.js";
import { UpdateAudienceRequest } from "./UpdateAudienceRequest.js";
import { UpdateAudienceResponse } from "./UpdateAudienceResponse.js";
import { UpdateAudienceCommandHandler } from "./UpdateAudienceCommandHandler.js";
import { IAudienceUpdateReader } from "./IAudienceUpdateReader.js";

export class LocalUpdateAudienceGateway implements IUpdateAudienceGateway {
  constructor(
    private readonly commandHandler: UpdateAudienceCommandHandler,
    private readonly reader: IAudienceUpdateReader,
  ) {}

  async updateAudience(
    request: UpdateAudienceRequest,
  ): Promise<UpdateAudienceResponse> {
    const result = await this.commandHandler.execute({
      audienceId: request.audienceId,
      name: request.name,
      description: request.description,
      priority: request.priority,
    });

    const view = await this.reader.findById(result.audienceId);

    return { audienceId: result.audienceId, view };
  }
}
