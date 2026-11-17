import { AddGuidelineRequest } from "./AddGuidelineRequest.js";
import { AddGuidelineResponse } from "./AddGuidelineResponse.js";
import { IAddGuidelineGateway } from "./IAddGuidelineGateway.js";

export class AddGuidelineController {
  constructor(private readonly gateway: IAddGuidelineGateway) {}

  async handle(request: AddGuidelineRequest): Promise<AddGuidelineResponse> {
    return this.gateway.addGuideline(request);
  }
}
