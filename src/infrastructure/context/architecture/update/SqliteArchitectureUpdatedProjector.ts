/**
 * SqliteArchitectureUpdatedProjector - SQLite projector for ArchitectureUpdated event.
 */

import { Database } from "better-sqlite3";
import { IArchitectureUpdatedProjector } from "../../../../application/context/architecture/update/IArchitectureUpdatedProjector.js";
import { IArchitectureUpdateReader } from "../../../../application/context/architecture/update/IArchitectureUpdateReader.js";
import { ArchitectureUpdatedEvent } from "../../../../domain/architecture/update/ArchitectureUpdatedEvent.js";
import { ArchitectureView } from "../../../../application/context/architecture/ArchitectureView.js";

export class SqliteArchitectureUpdatedProjector
  implements IArchitectureUpdatedProjector, IArchitectureUpdateReader
{
  constructor(private db: Database) {}

  async applyArchitectureUpdated(
    event: ArchitectureUpdatedEvent,
  ): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.description !== undefined) {
      updates.push("description = ?");
      params.push(event.payload.description);
    }
    if (event.payload.organization !== undefined) {
      updates.push("organization = ?");
      params.push(event.payload.organization);
    }
    if (event.payload.patterns !== undefined) {
      updates.push("patterns = ?");
      params.push(JSON.stringify(event.payload.patterns));
    }
    if (event.payload.principles !== undefined) {
      updates.push("principles = ?");
      params.push(JSON.stringify(event.payload.principles));
    }
    if (event.payload.dataStores !== undefined) {
      updates.push("dataStores = ?");
      params.push(JSON.stringify(event.payload.dataStores));
    }
    if (event.payload.stack !== undefined) {
      updates.push("stack = ?");
      params.push(JSON.stringify(event.payload.stack));
    }

    updates.push("version = ?", "updatedAt = ?");
    params.push(event.version, event.timestamp);
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE architecture_views
      SET ${updates.join(", ")}
      WHERE architectureId = ?
    `);

    stmt.run(...params);
  }

  async findById(id: string): Promise<ArchitectureView | null> {
    const row = this.db
      .prepare("SELECT * FROM architecture_views WHERE architectureId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ArchitectureView {
    return {
      architectureId: row.architectureId as string,
      description: row.description as string,
      organization: row.organization as string,
      patterns: JSON.parse((row.patterns as string) || "[]"),
      principles: JSON.parse((row.principles as string) || "[]"),
      dataStores: JSON.parse((row.dataStores as string) || "[]"),
      stack: JSON.parse((row.stack as string) || "[]"),
      deprecated: (row.deprecated as number) === 1,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
