import { IUpdateAudiencePainGateway } from "./IUpdateAudiencePainGateway.js";
import { UpdateAudiencePainRequest } from "./UpdateAudiencePainRequest.js";
import { UpdateAudiencePainResponse } from "./UpdateAudiencePainResponse.js";
import { UpdateAudiencePainCommandHandler } from "./UpdateAudiencePainCommandHandler.js";
import { IAudiencePainUpdateReader } from "./IAudiencePainUpdateReader.js";

export class LocalUpdateAudiencePainGateway implements IUpdateAudiencePainGateway {
  constructor(
    private readonly commandHandler: UpdateAudiencePainCommandHandler,
    private readonly reader: IAudiencePainUpdateReader,
  ) {}

  async updateAudiencePain(
    request: UpdateAudiencePainRequest,
  ): Promise<UpdateAudiencePainResponse> {
    const result = await this.commandHandler.execute({
      painId: request.painId,
      title: request.title,
      description: request.description,
    });

    const view = await this.reader.findById(result.painId);

    return { painId: result.painId, view };
  }
}
