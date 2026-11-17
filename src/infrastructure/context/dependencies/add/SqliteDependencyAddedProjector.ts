/**
 * SqliteDependencyAddedProjector - SQLite projector for DependencyAdded event.
 *
 * Implements IDependencyAddedProjector and IDependencyAddReader for projecting
 * dependency add events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IDependencyAddedProjector } from "../../../../application/context/dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../../../../application/context/dependencies/add/IDependencyAddReader.js";
import {
  DependencyAddedEvent,
  DependencyAddedEventPayload,
  ExternalDependencyPayload,
  LegacyComponentDependencyPayload,
} from "../../../../domain/dependencies/add/DependencyAddedEvent.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";
import { DependencyRecordMapper } from "../DependencyRecordMapper.js";
import { DependencyRecord } from "../DependencyRecord.js";

export class SqliteDependencyAddedProjector
  implements IDependencyAddedProjector, IDependencyAddReader
{
  private readonly mapper = new DependencyRecordMapper();

  constructor(private db: Database) {}

  async applyDependencyAdded(event: DependencyAddedEvent): Promise<void> {
    const externalPayload = this.upcastPayload(event.payload);
    const legacyPayload = this.asLegacyPayload(event.payload);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO dependency_views (
        dependencyId, consumerId, providerId, name, ecosystem, packageName, versionConstraint, endpoint, contract,
        status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      legacyPayload?.consumerId ?? "",
      legacyPayload?.providerId ?? "",
      externalPayload.name,
      externalPayload.ecosystem,
      externalPayload.packageName,
      externalPayload.versionConstraint,
      externalPayload.endpoint,
      externalPayload.contract,
      "active",
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }

  async findById(id: string): Promise<DependencyView | null> {
    const row = this.db
      .prepare("SELECT * FROM dependency_views WHERE dependencyId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  async findByIdentity(
    ecosystem: string,
    packageName: string,
  ): Promise<DependencyView | null> {
    const row = this.db
      .prepare(
        `
      SELECT * FROM dependency_views
      WHERE ecosystem = ? AND packageName = ? AND status != 'removed'
      ORDER BY createdAt DESC
      LIMIT 1
    `,
      )
      .get(ecosystem, packageName);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  async findByConsumerId(consumerId: string): Promise<DependencyView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM dependency_views WHERE consumerId = ? ORDER BY createdAt DESC",
      )
      .all(consumerId);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async findByProviderId(providerId: string): Promise<DependencyView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM dependency_views WHERE providerId = ? ORDER BY createdAt DESC",
      )
      .all(providerId);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  private mapRowToView(row: Record<string, unknown>): DependencyView {
    return this.mapper.toView(this.mapRowToRecord(row));
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

  private upcastPayload(
    payload: DependencyAddedEventPayload,
  ): ExternalDependencyPayload {
    if (
      "name" in payload &&
      "ecosystem" in payload &&
      "packageName" in payload
    ) {
      return payload;
    }

    const legacyPayload = payload as LegacyComponentDependencyPayload;
    return {
      name: legacyPayload.providerId,
      ecosystem: "legacy-component",
      packageName: legacyPayload.providerId,
      versionConstraint: null,
      endpoint: legacyPayload.endpoint,
      contract: legacyPayload.contract,
    };
  }

  private asLegacyPayload(
    payload: DependencyAddedEventPayload,
  ): LegacyComponentDependencyPayload | null {
    if ("consumerId" in payload && "providerId" in payload) {
      return payload;
    }
    return null;
  }
}
