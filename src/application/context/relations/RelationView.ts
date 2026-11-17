import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../domain/relations/Constants.js";

export interface RelationView {
  relationId: string;
  fromEntityType: EntityTypeValue;
  fromEntityId: string;
  toEntityType: EntityTypeValue;
  toEntityId: string;
  relationType: string;
  strength: RelationStrengthValue | null;
  description: string;
  status: "active" | "deactivated" | "removed";
  version: number;
  createdAt: string;
  updatedAt: string;
}
