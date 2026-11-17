import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";

/**
 * AddRelationRequest
 *
 * Request model for adding a relation between two entities.
 */
export interface AddRelationRequest {
  readonly fromEntityType: EntityTypeValue;
  readonly fromEntityId: string;
  readonly toEntityType: EntityTypeValue;
  readonly toEntityId: string;
  readonly relationType: string;
  readonly description: string;
  readonly strength?: RelationStrengthValue;
}
