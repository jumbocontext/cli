/**
 * ComponentSearchCriteria - Search filter for querying components.
 *
 * All fields are optional. When multiple fields are specified,
 * they are combined with AND logic.
 *
 * - name: substring match, or wildcard with * (e.g. Auth*, *Service)
 * - type: exact match
 * - status: exact match (defaults to excluding deprecated if not specified)
 * - query: substring match across description and responsibility fields (supports * wildcards)
 */

import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export interface ComponentSearchCriteria {
  readonly name?: string;
  readonly type?: ComponentTypeValue;
  readonly status?: ComponentStatusValue;
  readonly query?: string;
}
