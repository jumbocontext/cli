/**
 * SqliteInvariantAddedProjector - SQLite projector for InvariantAdded event.
 */

import { Database } from "better-sqlite3";
import { IInvariantAddedProjector } from "../../../../application/context/invariants/add/IInvariantAddedProjector.js";
import { IInvariantAddReader } from "../../../../application/context/invariants/add/IInvariantAddReader.js";
import { InvariantAddedEvent } from "../../../../domain/invariants/add/InvariantAddedEvent.js";
import { InvariantView } from "../../../../application/context/invariants/InvariantView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

export class SqliteInvariantAddedProjector
  implements IInvariantAddedProjector, IInvariantAddReader
{
  constructor(private db: Database) {}

  async applyInvariantAdded(event: InvariantAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO invariant_views (
        invariantId, title, description, rationale,
        version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.description,
      event.payload.rationale,
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }

  async findById(id: UUID): Promise<InvariantView | null> {
    const row = this.db
      .prepare("SELECT * FROM invariant_views WHERE invariantId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  async findByTitle(title: string): Promise<InvariantView | null> {
    const row = this.db
      .prepare("SELECT * FROM invariant_views WHERE title = ?")
      .get(title);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): InvariantView {
    return {
      invariantId: row.invariantId as string,
      title: row.title as string,
      description: row.description as string,
      rationale: (row.rationale as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
