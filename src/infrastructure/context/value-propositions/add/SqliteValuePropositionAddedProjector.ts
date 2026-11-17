/**
 * SqliteValuePropositionAddedProjector - SQLite projector for ValuePropositionAddedEvent event.
 *
 * Implements IValuePropositionAddedProjector for projecting value proposition add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IValuePropositionAddedProjector } from "../../../../application/context/value-propositions/add/IValuePropositionAddedProjector.js";
import { ValuePropositionAddedEvent } from "../../../../domain/value-propositions/add/ValuePropositionAddedEvent.js";

export class SqliteValuePropositionAddedProjector implements IValuePropositionAddedProjector {
  constructor(private db: Database) {}

  async applyValuePropositionAdded(
    event: ValuePropositionAddedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO value_proposition_views (
        valuePropositionId, title, description, benefit,
        measurableOutcome, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.description,
      event.payload.benefit,
      event.payload.measurableOutcome,
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }
}
