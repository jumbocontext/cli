/**
 * SqliteArchitectureDefinedProjector - SQLite projector for ArchitectureDefined event.
 */

import { Database } from "better-sqlite3";
import { IArchitectureDefinedProjector } from "../../../../application/context/architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../../../../application/context/architecture/define/IArchitectureDefineReader.js";
import { IArchitectureReader } from "../../../../application/context/architecture/IArchitectureReader.js";
import { ArchitectureDefinedEvent } from "../../../../domain/architecture/define/ArchitectureDefinedEvent.js";
import { ArchitectureView } from "../../../../application/context/architecture/ArchitectureView.js";

export class SqliteArchitectureDefinedProjector
  implements
    IArchitectureDefinedProjector,
    IArchitectureDefineReader,
    IArchitectureReader
{
  constructor(private db: Database) {}

  async applyArchitectureDefined(
    event: ArchitectureDefinedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO architecture_views (
        architectureId, description, organization, patterns, principles,
        dataStores, stack, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.description,
      event.payload.organization,
      JSON.stringify(event.payload.patterns),
      JSON.stringify(event.payload.principles),
      JSON.stringify(event.payload.dataStores),
      JSON.stringify(event.payload.stack),
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }

  async findById(id: string): Promise<ArchitectureView | null> {
    const row = this.db
      .prepare("SELECT * FROM architecture_views WHERE architectureId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  async find(): Promise<ArchitectureView | null> {
    return this.findById("architecture");
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
