/**
 * SqliteInvariantUpdatedProjector - SQLite projector for InvariantUpdated event.
 */

import { Database } from "better-sqlite3";
import { IInvariantUpdatedProjector } from "../../../../application/context/invariants/update/IInvariantUpdatedProjector.js";
import { IInvariantUpdateReader } from "../../../../application/context/invariants/update/IInvariantUpdateReader.js";
import { InvariantUpdatedEvent } from "../../../../domain/invariants/update/InvariantUpdatedEvent.js";
import { InvariantView } from "../../../../application/context/invariants/InvariantView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

export class SqliteInvariantUpdatedProjector
  implements IInvariantUpdatedProjector, IInvariantUpdateReader
{
  constructor(private db: Database) {}

  async applyInvariantUpdated(event: InvariantUpdatedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE invariant_views
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          rationale = COALESCE(?, rationale),
          version = ?,
          updatedAt = ?
      WHERE invariantId = ?
    `);

    stmt.run(
      event.payload.title !== undefined ? event.payload.title : null,
      event.payload.description !== undefined
        ? event.payload.description
        : null,
      event.payload.rationale !== undefined ? event.payload.rationale : null,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
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
