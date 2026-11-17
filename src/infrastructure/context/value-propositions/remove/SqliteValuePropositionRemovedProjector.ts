/**
 * SqliteValuePropositionRemovedProjector - SQLite projector for ValuePropositionRemovedEvent event.
 *
 * Implements IValuePropositionRemovedProjector and IValuePropositionRemoveReader for projecting
 * value proposition remove events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IValuePropositionRemovedProjector } from "../../../../application/context/value-propositions/remove/IValuePropositionRemovedProjector.js";
import { IValuePropositionRemoveReader } from "../../../../application/context/value-propositions/remove/IValuePropositionRemoveReader.js";
import { ValuePropositionRemovedEvent } from "../../../../domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { ValuePropositionView } from "../../../../application/context/value-propositions/ValuePropositionView.js";

export class SqliteValuePropositionRemovedProjector
  implements IValuePropositionRemovedProjector, IValuePropositionRemoveReader
{
  constructor(private db: Database) {}

  async applyValuePropositionRemoved(
    event: ValuePropositionRemovedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM value_proposition_views WHERE valuePropositionId = ?
    `);
    stmt.run(event.aggregateId);
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
