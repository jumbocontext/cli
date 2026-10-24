import { IShowGuidelineGateway } from "./IShowGuidelineGateway.js";
import { ShowGuidelineRequest } from "./ShowGuidelineRequest.js";
import { ShowGuidelineResponse } from "./ShowGuidelineResponse.js";

export class ShowGuidelineController {
  constructor(private readonly gateway: IShowGuidelineGateway) {}

  async handle(request: ShowGuidelineRequest): Promise<ShowGuidelineResponse> {
    return this.gateway.showGuideline(request);
  }
}
