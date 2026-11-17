import { RemoveGuidelineRequest } from "./RemoveGuidelineRequest.js";
import { RemoveGuidelineResponse } from "./RemoveGuidelineResponse.js";
import { IRemoveGuidelineGateway } from "./IRemoveGuidelineGateway.js";

export class RemoveGuidelineController {
  constructor(private readonly gateway: IRemoveGuidelineGateway) {}

  async handle(
    request: RemoveGuidelineRequest,
  ): Promise<RemoveGuidelineResponse> {
    return this.gateway.removeGuideline(request);
  }
}
