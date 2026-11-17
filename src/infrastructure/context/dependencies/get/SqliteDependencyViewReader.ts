/**
 * SqliteDependencyViewReader - SQLite reader for listing dependencies.
 *
 * Implements IDependencyViewReader for retrieving dependency list
 * from the SQLite read model with optional consumer/provider filtering.
 */

import { Database } from "better-sqlite3";
import {
  IDependencyViewReader,
  DependencyListFilter,
} from "../../../../application/context/dependencies/get/IDependencyViewReader.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";
import { DependencySearchCriteria } from "../../../../application/context/dependencies/search/DependencySearchCriteria.js";
import { DependencyRecord } from "../DependencyRecord.js";
import { DependencyRecordMapper } from "../DependencyRecordMapper.js";

export class SqliteDependencyViewReader implements IDependencyViewReader {
  private readonly mapper = new DependencyRecordMapper();

  constructor(private db: Database) {}

  async findAll(filter?: DependencyListFilter): Promise<DependencyView[]> {
    let query = "SELECT * FROM dependency_views";
    const conditions: string[] = [];
    const params: string[] = [];

    if (filter?.name) {
      conditions.push("name = ?");
      params.push(filter.name);
    }
    if (filter?.ecosystem) {
      conditions.push("ecosystem = ?");
      params.push(filter.ecosystem);
    }
    if (filter?.packageName) {
      conditions.push("packageName = ?");
      params.push(filter.packageName);
    }
    if (filter?.versionConstraint) {
      conditions.push("versionConstraint = ?");
      params.push(filter.versionConstraint);
    }

    if (filter?.consumer) {
      conditions.push("consumerId = ?");
      params.push(filter.consumer);
    }
    if (filter?.provider) {
      conditions.push("providerId = ?");
      params.push(filter.provider);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async findByIds(ids: string[]): Promise<DependencyView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM dependency_views WHERE dependencyId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async search(criteria: DependencySearchCriteria): Promise<DependencyView[]> {
    const clauses: string[] = [];
    const params: string[] = [];

    if (criteria.name !== undefined) {
      clauses.push("COALESCE(name, packageName, providerId, 'unknown') LIKE ?");
      params.push(this.toLikePattern(criteria.name));
    }

    if (criteria.ecosystem !== undefined) {
      clauses.push(
        "COALESCE(ecosystem, CASE WHEN providerId IS NOT NULL AND providerId != '' THEN 'legacy-component' ELSE 'unknown' END) LIKE ?",
      );
      params.push(this.toLikePattern(criteria.ecosystem));
    }

    if (criteria.packageName !== undefined) {
      clauses.push("COALESCE(packageName, providerId, 'unknown') LIKE ?");
      params.push(this.toLikePattern(criteria.packageName));
    }

    if (criteria.versionConstraint !== undefined) {
      clauses.push("COALESCE(versionConstraint, '') LIKE ?");
      params.push(this.toLikePattern(criteria.versionConstraint));
    }

    if (criteria.status !== undefined) {
      clauses.push("status = ?");
      params.push(criteria.status);
    }

    if (criteria.consumer !== undefined) {
      clauses.push("consumerId LIKE ?");
      params.push(this.toLikePattern(criteria.consumer));
    }

    if (criteria.provider !== undefined) {
      clauses.push("providerId LIKE ?");
      params.push(this.toLikePattern(criteria.provider));
    }

    if (criteria.query !== undefined) {
      const pattern = this.toLikePattern(criteria.query);
      clauses.push(`(
        COALESCE(name, packageName, providerId, 'unknown') LIKE ?
        OR COALESCE(ecosystem, CASE WHEN providerId IS NOT NULL AND providerId != '' THEN 'legacy-component' ELSE 'unknown' END) LIKE ?
        OR COALESCE(packageName, providerId, 'unknown') LIKE ?
        OR COALESCE(versionConstraint, '') LIKE ?
        OR COALESCE(contract, '') LIKE ?
        OR COALESCE(endpoint, '') LIKE ?
      )`);
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }

    let query = "SELECT * FROM dependency_views";
    if (clauses.length > 0) {
      query += " WHERE " + clauses.join(" AND ");
    }
    query += " ORDER BY createdAt DESC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  private toLikePattern(input: string): string {
    if (input.includes("*")) {
      return input.replace(/\*/g, "%");
    }
    return `%${input}%`;
  }

  private mapRowToRecord(row: Record<string, unknown>): DependencyRecord {
    return {
      id: row.dependencyId as string,
      name: (row.name as string) ?? null,
      ecosystem: (row.ecosystem as string) ?? null,
      packageName: (row.packageName as string) ?? null,
      versionConstraint: (row.versionConstraint as string) ?? null,
      consumerId: (row.consumerId as string) ?? null,
      providerId: (row.providerId as string) ?? null,
      endpoint: (row.endpoint as string) ?? null,
      contract: (row.contract as string) ?? null,
      status: row.status as string,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
    };
  }
}
