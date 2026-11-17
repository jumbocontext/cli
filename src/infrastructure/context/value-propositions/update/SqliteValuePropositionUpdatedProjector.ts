/**
 * SqliteValuePropositionUpdatedProjector - SQLite projector for ValuePropositionUpdatedEvent event.
 *
 * Implements IValuePropositionUpdatedProjector and IValuePropositionUpdateReader for projecting
 * value proposition update events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IValuePropositionUpdatedProjector } from "../../../../application/context/value-propositions/update/IValuePropositionUpdatedProjector.js";
import { IValuePropositionUpdateReader } from "../../../../application/context/value-propositions/update/IValuePropositionUpdateReader.js";
import { ValuePropositionUpdatedEvent } from "../../../../domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionView } from "../../../../application/context/value-propositions/ValuePropositionView.js";

export class SqliteValuePropositionUpdatedProjector
  implements IValuePropositionUpdatedProjector, IValuePropositionUpdateReader
{
  constructor(private db: Database) {}

  async applyValuePropositionUpdated(
    event: ValuePropositionUpdatedEvent,
  ): Promise<void> {
    // Build dynamic UPDATE statement based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];

    if (event.payload.title !== undefined) {
      updates.push("title = ?");
      values.push(event.payload.title);
    }
    if (event.payload.description !== undefined) {
      updates.push("description = ?");
      values.push(event.payload.description);
    }
    if (event.payload.benefit !== undefined) {
      updates.push("benefit = ?");
      values.push(event.payload.benefit);
    }
    if (event.payload.measurableOutcome !== undefined) {
      updates.push("measurableOutcome = ?");
      values.push(event.payload.measurableOutcome);
    }

    if (updates.length > 0) {
      updates.push("version = ?");
      updates.push("updatedAt = ?");
      values.push(event.version, event.timestamp, event.aggregateId);

      const stmt = this.db.prepare(`
        UPDATE value_proposition_views
        SET ${updates.join(", ")}
        WHERE valuePropositionId = ?
      `);

      stmt.run(...values);
    }
  }

  async findById(id: string): Promise<ValuePropositionView | null> {
    const row = this.db
      .prepare(
        "SELECT * FROM value_proposition_views WHERE valuePropositionId = ?",
      )
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ValuePropositionView {
    return {
      valuePropositionId: row.valuePropositionId as string,
      title: row.title as string,
      description: row.description as string,
      benefit: row.benefit as string,
      measurableOutcome: row.measurableOutcome as string | null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
