import {
  EntityTypeValue,
  RelationAuditCheckValue,
} from "../../../../domain/relations/Constants.js";

export interface AuditRelationsRequest {
  readonly checks?: readonly RelationAuditCheckValue[];
  readonly entityType?: EntityTypeValue;
}
