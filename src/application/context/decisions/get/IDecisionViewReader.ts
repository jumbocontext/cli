/**
 * Port interface for listing decisions from the projection store.
 * Used by ListDecisionsQueryHandler to retrieve decision list with filtering.
 */

import { DecisionView } from "../DecisionView.js";
import type { DecisionSearchCriteria } from "../search/DecisionSearchCriteria.js";

import type { DecisionStatusType } from "../../../../domain/decisions/Constants.js";

export type DecisionStatusFilter = DecisionStatusType | "all";

export interface IDecisionViewReader {
  /**
   * Retrieves all decisions, including removed history, optionally filtered by status.
   * @param status - Filter by status, or "all" for all decisions
   * @returns Array of decision views ordered by creation date (newest first)
   */
  findAll(status?: DecisionStatusFilter): Promise<DecisionView[]>;

  /**
   * Retrieves decisions by their IDs, including removed history.
   * @param ids - Array of decision IDs to retrieve
   * @returns Array of decision views ordered by creation date (newest first)
   */
  findByIds(ids: string[]): Promise<DecisionView[]>;

  /**
   * Searches decisions by criteria with AND logic. Omitted/all status includes removed history.
   * @param criteria - Search filters (status exact, title substring, query across decision text fields)
   * @returns Array of matching decision views ordered by creation date (newest first)
   */
  search(criteria: DecisionSearchCriteria): Promise<DecisionView[]>;
}
