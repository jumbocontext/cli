import { IGetGuidelinesGateway } from "./IGetGuidelinesGateway.js";
import { GetGuidelinesRequest } from "./GetGuidelinesRequest.js";
import { GetGuidelinesResponse } from "./GetGuidelinesResponse.js";
import { IGuidelineViewReader } from "./IGuidelineViewReader.js";

export class LocalGetGuidelinesGateway implements IGetGuidelinesGateway {
  constructor(private readonly guidelineViewReader: IGuidelineViewReader) {}

  async getGuidelines(
    request: GetGuidelinesRequest,
  ): Promise<GetGuidelinesResponse> {
    const guidelines = await this.guidelineViewReader.findAll(request.category);
    return { guidelines };
  }
}
