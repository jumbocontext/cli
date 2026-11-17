/**
 * SqliteDecisionViewReader - SQLite reader for listing decisions.
 *
 * Implements IDecisionViewReader for retrieving decision list
 * from the SQLite read model with optional status filtering.
 */

import { Database } from "better-sqlite3";
import {
  IDecisionViewReader,
  DecisionStatusFilter,
} from "../../../../application/context/decisions/get/IDecisionViewReader.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";
import { DecisionSearchCriteria } from "../../../../application/context/decisions/search/DecisionSearchCriteria.js";
import { DecisionRecord } from "../DecisionRecord.js";
import { DecisionRecordMapper } from "../DecisionRecordMapper.js";

export class SqliteDecisionViewReader implements IDecisionViewReader {
  private readonly mapper = new DecisionRecordMapper();

  constructor(private db: Database) {}

  async findAll(status: DecisionStatusFilter = "all"): Promise<DecisionView[]> {
    let query = "SELECT * FROM decision_views";
    const params: string[] = [];

    if (status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async findByIds(ids: string[]): Promise<DecisionView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM decision_views WHERE decisionId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async search(criteria: DecisionSearchCriteria): Promise<DecisionView[]> {
    const clauses: string[] = [];
    const params: string[] = [];

    if (criteria.status !== undefined && criteria.status !== "all") {
      clauses.push("status = ?");
      params.push(criteria.status);
    }

    if (criteria.title !== undefined) {
      clauses.push("title LIKE ?");
      params.push(this.toLikePattern(criteria.title));
    }

    if (criteria.query !== undefined) {
      const pattern = this.toLikePattern(criteria.query);
      clauses.push(
        "(" +
          [
            "title LIKE ?",
            "context LIKE ?",
            "COALESCE(rationale, '') LIKE ?",
            "COALESCE(alternatives, '') LIKE ?",
            "COALESCE(consequences, '') LIKE ?",
            "COALESCE(reversalReason, '') LIKE ?",
            "COALESCE(supersededBy, '') LIKE ?",
          ].join(" OR ") +
          ")",
      );
      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
      );
    }

    let query = "SELECT * FROM decision_views";
    if (clauses.length > 0) {
      query += " WHERE " + clauses.join(" AND ");
    }
    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  /**
   * Converts a user input string to a SQL LIKE pattern.
   * If the input contains *, replaces * with % for explicit wildcard control.
   * Otherwise wraps with % for default substring matching.
   */
  private toLikePattern(input: string): string {
    if (input.includes("*")) {
      return input.replace(/\*/g, "%");
    }
    return `%${input}%`;
  }

  private mapRowToRecord(row: Record<string, unknown>): DecisionRecord {
    return {
      id: row.decisionId as string,
      title: row.title as string,
      context: row.context as string,
      rationale: (row.rationale as string) ?? null,
      alternatives: (row.alternatives as string) || "[]",
      consequences: (row.consequences as string) ?? null,
      status: row.status as string,
      supersededBy: (row.supersededBy as string) ?? null,
      reversalReason: (row.reversalReason as string) ?? null,
      reversedAt: (row.reversedAt as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
