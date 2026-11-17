import {
  EntityTypeValue,
  RelationAuditCheckValue,
} from "../../../../domain/relations/Constants.js";
import { AmbiguousRelationNodeFinding } from "./AmbiguousRelationNodeFinding.js";
import { DanglingRelationFinding } from "./DanglingRelationFinding.js";
import { InactiveOnlyRelationNodeFinding } from "./InactiveOnlyRelationNodeFinding.js";
import { IsolatedRelationNodeFinding } from "./IsolatedRelationNodeFinding.js";
import { RelationAuditSummary } from "./RelationAuditSummary.js";

export interface RelationAuditResult {
  readonly requestedChecks: readonly RelationAuditCheckValue[];
  readonly entityType: EntityTypeValue | null;
  readonly summary: RelationAuditSummary;
  readonly findings: {
    readonly dangling: {
      readonly count: number;
      readonly items: readonly DanglingRelationFinding[];
    };
    readonly isolated: {
      readonly count: number;
      readonly items: readonly IsolatedRelationNodeFinding[];
    };
    readonly inactiveOnly: {
      readonly count: number;
      readonly items: readonly InactiveOnlyRelationNodeFinding[];
    };
    readonly ambiguousId: {
      readonly count: number;
      readonly items: readonly AmbiguousRelationNodeFinding[];
    };
  };
}
