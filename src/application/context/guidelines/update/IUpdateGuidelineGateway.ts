import { UpdateGuidelineRequest } from "./UpdateGuidelineRequest.js";
import { UpdateGuidelineResponse } from "./UpdateGuidelineResponse.js";

export interface IUpdateGuidelineGateway {
  updateGuideline(
    request: UpdateGuidelineRequest,
  ): Promise<UpdateGuidelineResponse>;
}
