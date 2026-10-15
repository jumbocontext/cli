import type { Database } from "better-sqlite3";
import type { IDecisionRemovedProjector } from "../../../../application/context/decisions/remove/IDecisionRemovedProjector.js";
import type { DecisionRemovedEvent } from "../../../../domain/decisions/remove/DecisionRemovedEvent.js";

export class SqliteDecisionRemovedProjector implements IDecisionRemovedProjector {
  constructor(private readonly db: Database) {}

  async applyDecisionRemoved(event: DecisionRemovedEvent): Promise<void> {
    this.db.prepare(`
      UPDATE decision_views
      SET status = ?, version = ?, updatedAt = ?
      WHERE decisionId = ?
    `).run(event.payload.status, event.version, event.timestamp, event.aggregateId);
  }
}
