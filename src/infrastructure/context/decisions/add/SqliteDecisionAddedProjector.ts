/**
 * SqliteDecisionAddedProjector - SQLite projector for DecisionAdded event.
 *
 * Implements IDecisionAddedProjector for projecting decision add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IDecisionAddedProjector } from "../../../../application/context/decisions/add/IDecisionAddedProjector.js";
import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";

export class SqliteDecisionAddedProjector implements IDecisionAddedProjector {
  constructor(private db: Database) {}

  async applyDecisionAdded(event: DecisionAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO decision_views (
        decisionId, title, context, rationale, alternatives,
        consequences, status, supersededBy, reversalReason, reversedAt,
        version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.context,
      event.payload.rationale,
      JSON.stringify(event.payload.alternatives),
      event.payload.consequences,
      "active",
      null,
      null,
      null,
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }
}
