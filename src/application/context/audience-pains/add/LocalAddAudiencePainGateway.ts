import { IAddAudiencePainGateway } from "./IAddAudiencePainGateway.js";
import { AddAudiencePainRequest } from "./AddAudiencePainRequest.js";
import { AddAudiencePainResponse } from "./AddAudiencePainResponse.js";
import { AddAudiencePainCommandHandler } from "./AddAudiencePainCommandHandler.js";
import { IAudiencePainUpdateReader } from "../update/IAudiencePainUpdateReader.js";

export class LocalAddAudiencePainGateway implements IAddAudiencePainGateway {
  constructor(
    private readonly commandHandler: AddAudiencePainCommandHandler,
    private readonly painReader: IAudiencePainUpdateReader,
  ) {}

  async addAudiencePain(
    request: AddAudiencePainRequest,
  ): Promise<AddAudiencePainResponse> {
    const result = await this.commandHandler.execute({
      title: request.title,
      description: request.description,
    });

    const view = await this.painReader.findById(result.painId);

    return {
      painId: result.painId,
      title: request.title,
      description: request.description,
      version: view ? view.version : null,
    };
  }
}
