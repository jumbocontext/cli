import { RelationView } from "./RelationView.js";
import { EntityTypeValue } from "../../../domain/relations/Constants.js";

/**
 * Port interface for reading relation data for context queries.
 * Used by GetGoalContextQueryHandler and other read operations.
 */
export interface IRelationReader {
  findByFromEntity(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<RelationView[]>;
  findByToEntity(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<RelationView[]>;
}
