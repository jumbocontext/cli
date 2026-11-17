import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";

export interface AddRelationCommand {
  fromEntityType: EntityTypeValue;
  fromEntityId: string;
  toEntityType: EntityTypeValue;
  toEntityId: string;
  relationType: string;
  description: string;
  strength?: RelationStrengthValue;
}
