import { IGetRelationsGateway } from "./IGetRelationsGateway.js";
import { GetRelationsRequest } from "./GetRelationsRequest.js";
import { GetRelationsResponse } from "./GetRelationsResponse.js";
import { IRelationViewReader } from "./IRelationViewReader.js";
import {
  EntityType,
  RelationStrength,
} from "../../../../domain/relations/Constants.js";

export class LocalGetRelationsGateway implements IGetRelationsGateway {
  constructor(private readonly relationViewReader: IRelationViewReader) {}

  async getRelations(
    request: GetRelationsRequest,
  ): Promise<GetRelationsResponse> {
    this.validate(request);
    const entity =
      request.entity ??
      (request.entityType && request.entityId
        ? { entityType: request.entityType, entityId: request.entityId }
        : undefined);
    const relations = await this.relationViewReader.findAll({
      entity,
      entityType: request.entityType,
      entityId: request.entityId,
      direction: request.direction,
      relationType: request.relationType,
      relatedEntityType: request.relatedEntityType,
      strength: request.strength,
      status: request.status,
    });
    return { relations };
  }

  private validate(request: GetRelationsRequest): void {
    if (
      request.direction &&
      !["in", "out", "both"].includes(request.direction)
    ) {
      throw new Error("Direction must be one of: in, out, both.");
    }
    if (!["active", "deactivated", "removed", "all"].includes(request.status)) {
      throw new Error(
        "Status must be one of: active, deactivated, removed, all.",
      );
    }
    if (
      request.entityType &&
      !Object.values(EntityType).includes(request.entityType)
    ) {
      throw new Error(
        `Entity type must be one of: ${Object.values(EntityType).join(", ")}.`,
      );
    }
    if (
      request.entity &&
      !Object.values(EntityType).includes(request.entity.entityType)
    ) {
      throw new Error(
        `Entity type must be one of: ${Object.values(EntityType).join(", ")}.`,
      );
    }
    if (
      request.relatedEntityType &&
      !Object.values(EntityType).includes(request.relatedEntityType)
    ) {
      throw new Error(
        `Related entity type must be one of: ${Object.values(EntityType).join(", ")}.`,
      );
    }
    if (
      request.strength &&
      !Object.values(RelationStrength).includes(request.strength)
    ) {
      throw new Error("Strength must be one of: strong, medium, weak.");
    }
  }
}
