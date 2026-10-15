/**
 * DecisionSearchCriteria - Search filter for querying decisions.
 *
 * All fields are optional. When multiple fields are specified,
 * they are combined with AND logic.
 *
 * - status: exact match (including removed), or omitted/all for all historical decisions
 * - title: substring match, or wildcard with * (e.g. Output*, *Boundary)
 * - query: substring match across decision text fields (supports * wildcards)
 */

import type { DecisionStatusFilter } from "../get/IDecisionViewReader.js";

export interface DecisionSearchCriteria {
  readonly status?: DecisionStatusFilter;
  readonly title?: string;
  readonly query?: string;
}
