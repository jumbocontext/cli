import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";
import { RelationDirection } from "./RelationDirection.js";
import { RelationStatusFilter } from "./RelationStatusFilter.js";
import { RelationNodeReference } from "./RelationNodeReference.js";

export interface GetRelationsRequest {
  readonly entity?: RelationNodeReference;
  readonly entityType?: EntityTypeValue;
  readonly entityId?: string;
  readonly direction?: RelationDirection;
  readonly relationType?: string;
  readonly relatedEntityType?: EntityTypeValue;
  readonly strength?: RelationStrengthValue;
  readonly status: RelationStatusFilter;
}
