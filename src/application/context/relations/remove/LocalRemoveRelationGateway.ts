import { IRemoveRelationGateway } from "./IRemoveRelationGateway.js";
import { RemoveRelationRequest } from "./RemoveRelationRequest.js";
import { RemoveRelationResponse } from "./RemoveRelationResponse.js";
import { RemoveRelationCommandHandler } from "./RemoveRelationCommandHandler.js";
import { IRelationRemovedReader } from "./IRelationRemovedReader.js";

export class LocalRemoveRelationGateway implements IRemoveRelationGateway {
  constructor(
    private readonly commandHandler: RemoveRelationCommandHandler,
    private readonly reader: IRelationRemovedReader,
  ) {}

  async removeRelation(
    request: RemoveRelationRequest,
  ): Promise<RemoveRelationResponse> {
    // Fetch relation details before removal for display
    const relation = await this.reader.findById(request.relationId);

    await this.commandHandler.execute({
      relationId: request.relationId,
      reason: request.reason,
    });

    const response: RemoveRelationResponse = {
      relationId: request.relationId,
      ...(relation
        ? {
            from: `${relation.fromEntityType}:${relation.fromEntityId}`,
            relationType: relation.relationType,
            to: `${relation.toEntityType}:${relation.toEntityId}`,
          }
        : {}),
    };

    return response;
  }
}
