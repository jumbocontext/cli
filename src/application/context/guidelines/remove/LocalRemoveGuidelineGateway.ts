import { IRemoveGuidelineGateway } from "./IRemoveGuidelineGateway.js";
import { RemoveGuidelineRequest } from "./RemoveGuidelineRequest.js";
import { RemoveGuidelineResponse } from "./RemoveGuidelineResponse.js";
import { RemoveGuidelineCommandHandler } from "./RemoveGuidelineCommandHandler.js";
import { IGuidelineRemoveReader } from "./IGuidelineRemoveReader.js";

export class LocalRemoveGuidelineGateway implements IRemoveGuidelineGateway {
  constructor(
    private readonly commandHandler: RemoveGuidelineCommandHandler,
    private readonly guidelineReader: IGuidelineRemoveReader,
  ) {}

  async removeGuideline(
    request: RemoveGuidelineRequest,
  ): Promise<RemoveGuidelineResponse> {
    // Fetch view before removal for display
    const view = await this.guidelineReader.findById(request.guidelineId);

    // Execute command
    const result = await this.commandHandler.execute({
      guidelineId: request.guidelineId,
      reason: request.reason,
    });

    return {
      guidelineId: result.guidelineId,
      title: view?.title || request.guidelineId,
    };
  }
}
