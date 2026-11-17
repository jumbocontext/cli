import { UpdateGuidelineRequest } from "./UpdateGuidelineRequest.js";
import { UpdateGuidelineResponse } from "./UpdateGuidelineResponse.js";
import { IUpdateGuidelineGateway } from "./IUpdateGuidelineGateway.js";

export class UpdateGuidelineController {
  constructor(private readonly gateway: IUpdateGuidelineGateway) {}

  async handle(
    request: UpdateGuidelineRequest,
  ): Promise<UpdateGuidelineResponse> {
    return this.gateway.updateGuideline(request);
  }
}
