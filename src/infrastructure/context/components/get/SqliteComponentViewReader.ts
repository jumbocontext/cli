/**
 * SqliteComponentViewReader - SQLite reader for listing components.
 *
 * Implements IComponentViewReader for retrieving component list
 * from the SQLite read model with optional status filtering.
 */

import { Database } from "better-sqlite3";
import {
  IComponentViewReader,
  ComponentStatusFilter,
} from "../../../../application/context/components/get/IComponentViewReader.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import { ComponentSearchCriteria } from "../../../../application/context/components/search/ComponentSearchCriteria.js";
import { ComponentRecord } from "../ComponentRecord.js";
import { ComponentRecordMapper } from "../ComponentRecordMapper.js";

export class SqliteComponentViewReader implements IComponentViewReader {
  private readonly mapper = new ComponentRecordMapper();

  constructor(private db: Database) {}

  async findAll(
    status: ComponentStatusFilter = "all",
  ): Promise<ComponentView[]> {
    let query = "SELECT * FROM component_views";
    const params: string[] = [];

    if (status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY name";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async findByIds(ids: string[]): Promise<ComponentView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM component_views WHERE componentId IN (${placeholders}) ORDER BY name`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async search(criteria: ComponentSearchCriteria): Promise<ComponentView[]> {
    const clauses: string[] = [];
    const params: string[] = [];

    if (criteria.name !== undefined) {
      clauses.push("name LIKE ?");
      params.push(this.toLikePattern(criteria.name));
    }

    if (criteria.type !== undefined) {
      clauses.push("type = ?");
      params.push(criteria.type);
    }

    if (criteria.status !== undefined) {
      clauses.push("status = ?");
      params.push(criteria.status);
    } else {
      clauses.push("status != 'deprecated'");
    }

    if (criteria.query !== undefined) {
      const pattern = this.toLikePattern(criteria.query);
      clauses.push("(description LIKE ? OR responsibility LIKE ?)");
      params.push(pattern, pattern);
    }

    let query = "SELECT * FROM component_views";
    if (clauses.length > 0) {
      query += " WHERE " + clauses.join(" AND ");
    }
    query += " ORDER BY name";

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

  private mapRowToRecord(row: Record<string, unknown>): ComponentRecord {
    return {
      id: row.componentId as string,
      name: row.name as string,
      type: row.type as string,
      description: row.description as string,
      responsibility: row.responsibility as string,
      path: row.path as string,
      status: row.status as string,
      deprecationReason: (row.deprecationReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
