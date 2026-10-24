import { IGuidelineViewReader } from "../get/IGuidelineViewReader.js";
import { IShowGuidelineGateway } from "./IShowGuidelineGateway.js";
import { ShowGuidelineRequest } from "./ShowGuidelineRequest.js";
import { ShowGuidelineResponse } from "./ShowGuidelineResponse.js";

export class LocalShowGuidelineGateway implements IShowGuidelineGateway {
  constructor(private readonly guidelineViewReader: IGuidelineViewReader) {}

  async showGuideline(request: ShowGuidelineRequest): Promise<ShowGuidelineResponse> {
    const [guideline] = await this.guidelineViewReader.findByIds([request.guidelineId]);

    if (!guideline) {
      throw new Error(`Guideline not found: ${request.guidelineId}`);
    }

    return { guideline };
  }
}
