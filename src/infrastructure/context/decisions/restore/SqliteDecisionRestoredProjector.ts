import { Database } from "better-sqlite3";
import { IDecisionRestoredProjector } from "../../../../application/context/decisions/restore/IDecisionRestoredProjector.js";
import { IDecisionRestoreReader } from "../../../../application/context/decisions/restore/IDecisionRestoreReader.js";
import { DecisionRestoredEvent } from "../../../../domain/decisions/restore/DecisionRestoredEvent.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export class SqliteDecisionRestoredProjector
  implements IDecisionRestoredProjector, IDecisionRestoreReader
{
  constructor(private db: Database) {}

  async applyDecisionRestored(event: DecisionRestoredEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE decision_views
      SET status = 'active',
          supersededBy = NULL,
          reversalReason = NULL,
          reversedAt = NULL,
          version = ?,
          updatedAt = ?
      WHERE decisionId = ?
    `);

    stmt.run(event.version, event.timestamp, event.aggregateId);
  }

  async findById(decisionId: string): Promise<DecisionView | null> {
    const row = this.db
      .prepare("SELECT * FROM decision_views WHERE decisionId = ?")
      .get(decisionId) as Record<string, unknown> | undefined;
    return row ? this.mapRowToView(row) : null;
  }

  private mapRowToView(row: Record<string, unknown>): DecisionView {
    return {
      decisionId: row.decisionId as string,
      title: row.title as string,
      context: row.context as string,
      rationale: (row.rationale as string) ?? null,
      alternatives: JSON.parse((row.alternatives as string) || "[]"),
      consequences: (row.consequences as string) ?? null,
      status: row.status as DecisionView["status"],
      supersededBy: (row.supersededBy as string) ?? null,
      reversalReason: (row.reversalReason as string) ?? null,
      reversedAt: (row.reversedAt as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
