import { IAddGuidelineGateway } from "./IAddGuidelineGateway.js";
import { AddGuidelineRequest } from "./AddGuidelineRequest.js";
import { AddGuidelineResponse } from "./AddGuidelineResponse.js";
import { AddGuidelineCommandHandler } from "./AddGuidelineCommandHandler.js";

export class LocalAddGuidelineGateway implements IAddGuidelineGateway {
  constructor(private readonly commandHandler: AddGuidelineCommandHandler) {}

  async addGuideline(
    request: AddGuidelineRequest,
  ): Promise<AddGuidelineResponse> {
    const result = await this.commandHandler.execute({
      category: request.category,
      title: request.title,
      description: request.description,
      rationale: request.rationale,
      examples: request.examples,
    });

    return {
      guidelineId: result.guidelineId,
    };
  }
}
