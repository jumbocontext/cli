/**
 * Read model for Decision aggregate.
 * Represents the storage-agnostic projected state exposed by decision read ports.
 */
import type { DecisionStatusType } from "../../../domain/decisions/Constants.js";

export interface DecisionView {
  readonly decisionId: string;
  readonly title: string;
  readonly context: string;
  readonly rationale: string | null;
  readonly alternatives: string[];
  readonly consequences: string | null;
  readonly status: DecisionStatusType;
  readonly supersededBy: string | null;
  readonly reversalReason: string | null;
  readonly reversedAt: string | null;  // ISO8601 timestamp when decision was reversed
  readonly version: number;
  readonly createdAt: string;     // ISO8601
  readonly updatedAt: string;     // ISO8601
}
