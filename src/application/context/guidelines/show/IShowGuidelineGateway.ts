import { ShowGuidelineRequest } from "./ShowGuidelineRequest.js";
import { ShowGuidelineResponse } from "./ShowGuidelineResponse.js";

export interface IShowGuidelineGateway {
  showGuideline(request: ShowGuidelineRequest): Promise<ShowGuidelineResponse>;
}
