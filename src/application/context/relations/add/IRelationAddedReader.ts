import { RelationView } from "../RelationView.js";
import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

/**
 * Port interface for reading relation data needed by AddRelationCommandHandler.
 * Used to check for non-removed relations (idempotency check).
 * Removed relations are historical connections and must not prevent a new add.
 */
export interface IRelationAddedReader {
  findByEntities(
    fromEntityType: EntityTypeValue,
    fromEntityId: string,
    toEntityType: EntityTypeValue,
    toEntityId: string,
    relationType: string
  ): Promise<RelationView | null>;
}
