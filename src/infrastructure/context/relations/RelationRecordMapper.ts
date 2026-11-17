/**
 * RelationRecordMapper - Maps infrastructure RelationRecord to application RelationView.
 *
 * Handles type casting at the infrastructure-application boundary.
 */

import { RelationView } from "../../../application/context/relations/RelationView.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../domain/relations/Constants.js";
import { RelationRecord } from "./RelationRecord.js";

export class RelationRecordMapper {
  toView(record: RelationRecord): RelationView {
    return {
      relationId: record.id,
      fromEntityType: record.fromEntityType as EntityTypeValue,
      fromEntityId: record.fromEntityId,
      toEntityType: record.toEntityType as EntityTypeValue,
      toEntityId: record.toEntityId,
      relationType: record.relationType,
      strength: record.strength as RelationStrengthValue | null,
      description: record.description,
      status: record.status as "active" | "deactivated" | "removed",
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
