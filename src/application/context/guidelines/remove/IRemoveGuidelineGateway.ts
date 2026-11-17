import { RemoveGuidelineRequest } from "./RemoveGuidelineRequest.js";
import { RemoveGuidelineResponse } from "./RemoveGuidelineResponse.js";

export interface IRemoveGuidelineGateway {
  removeGuideline(
    request: RemoveGuidelineRequest,
  ): Promise<RemoveGuidelineResponse>;
}
