/**
 * SqliteInvariantRemovedProjector - SQLite projector for InvariantRemoved event.
 */

import { Database } from "better-sqlite3";
import { IInvariantRemovedProjector } from "../../../../application/context/invariants/remove/IInvariantRemovedProjector.js";
import { IInvariantRemoveReader } from "../../../../application/context/invariants/remove/IInvariantRemoveReader.js";
import { InvariantRemovedEvent } from "../../../../domain/invariants/remove/InvariantRemovedEvent.js";
import { InvariantView } from "../../../../application/context/invariants/InvariantView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

export class SqliteInvariantRemovedProjector
  implements IInvariantRemovedProjector, IInvariantRemoveReader
{
  constructor(private db: Database) {}

  async applyInvariantRemoved(event: InvariantRemovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM invariant_views WHERE invariantId = ?
    `);
    stmt.run(event.aggregateId);
  }

  async findById(id: UUID): Promise<InvariantView | null> {
    const row = this.db
      .prepare("SELECT * FROM invariant_views WHERE invariantId = ?")
      .get(id);
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
