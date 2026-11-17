import { IAddRelationGateway } from "./IAddRelationGateway.js";
import { AddRelationRequest } from "./AddRelationRequest.js";
import { AddRelationResponse } from "./AddRelationResponse.js";
import { AddRelationCommandHandler } from "./AddRelationCommandHandler.js";

export class LocalAddRelationGateway implements IAddRelationGateway {
  constructor(private readonly commandHandler: AddRelationCommandHandler) {}

  async addRelation(request: AddRelationRequest): Promise<AddRelationResponse> {
    const result = await this.commandHandler.execute({
      fromEntityType: request.fromEntityType,
      fromEntityId: request.fromEntityId,
      toEntityType: request.toEntityType,
      toEntityId: request.toEntityId,
      relationType: request.relationType,
      description: request.description,
      strength: request.strength,
    });

    return { relationId: result.relationId };
  }
}
