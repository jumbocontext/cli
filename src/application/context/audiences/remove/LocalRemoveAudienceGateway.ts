import { IRemoveAudienceGateway } from "./IRemoveAudienceGateway.js";
import { RemoveAudienceRequest } from "./RemoveAudienceRequest.js";
import { RemoveAudienceResponse } from "./RemoveAudienceResponse.js";
import { RemoveAudienceCommandHandler } from "./RemoveAudienceCommandHandler.js";
import { IAudienceRemoveReader } from "./IAudienceRemoveReader.js";
import {
  AudienceErrorMessages,
  formatErrorMessage,
} from "../../../../domain/audiences/Constants.js";

export class LocalRemoveAudienceGateway implements IRemoveAudienceGateway {
  constructor(
    private readonly commandHandler: RemoveAudienceCommandHandler,
    private readonly reader: IAudienceRemoveReader,
  ) {}

  async removeAudience(
    request: RemoveAudienceRequest,
  ): Promise<RemoveAudienceResponse> {
    const view = await this.reader.findById(request.audienceId);
    if (!view) {
      throw new Error(
        formatErrorMessage(AudienceErrorMessages.NOT_FOUND_WITH_ID, {
          id: request.audienceId,
        }),
      );
    }

    await this.commandHandler.execute({
      audienceId: request.audienceId,
      reason: request.reason,
    });

    return {
      audienceId: request.audienceId,
      name: view.name,
    };
  }
}
