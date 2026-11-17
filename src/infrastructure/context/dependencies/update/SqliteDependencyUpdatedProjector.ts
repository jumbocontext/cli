/**
 * SqliteDependencyUpdatedProjector - SQLite projector for DependencyUpdated event.
 *
 * Implements IDependencyUpdatedProjector and IDependencyUpdateReader for projecting
 * dependency update events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IDependencyUpdatedProjector } from "../../../../application/context/dependencies/update/IDependencyUpdatedProjector.js";
import { IDependencyUpdateReader } from "../../../../application/context/dependencies/update/IDependencyUpdateReader.js";
import { DependencyUpdatedEvent } from "../../../../domain/dependencies/update/DependencyUpdatedEvent.js";
import { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";
import { DependencyRecordMapper } from "../DependencyRecordMapper.js";
import { DependencyRecord } from "../DependencyRecord.js";

export class SqliteDependencyUpdatedProjector
  implements IDependencyUpdatedProjector, IDependencyUpdateReader
{
  private readonly mapper = new DependencyRecordMapper();

  constructor(private db: Database) {}

  async applyDependencyUpdated(event: DependencyUpdatedEvent): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.endpoint !== undefined) {
      updates.push("endpoint = ?");
      params.push(event.payload.endpoint);
    }
    if (event.payload.contract !== undefined) {
      updates.push("contract = ?");
      params.push(event.payload.contract);
    }
    if (event.payload.status !== undefined) {
      updates.push("status = ?");
      params.push(event.payload.status);
    }

    updates.push("version = ?");
    params.push(event.version);
    updates.push("updatedAt = ?");
    params.push(event.timestamp);
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE dependency_views
      SET ${updates.join(", ")}
      WHERE dependencyId = ?
    `);

    stmt.run(...params);
  }

  async findById(id: string): Promise<DependencyView | null> {
    const row = this.db
      .prepare("SELECT * FROM dependency_views WHERE dependencyId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
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
}
