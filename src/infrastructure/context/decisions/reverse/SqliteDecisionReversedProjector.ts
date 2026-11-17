/**
 * SqliteDecisionReversedProjector - SQLite projector for DecisionReversed event.
 *
 * Implements IDecisionReversedProjector and IDecisionReverseReader for projecting
 * decision reverse events to the SQLite read model and reading decisions.
 */

import { Database } from "better-sqlite3";
import { IDecisionReversedProjector } from "../../../../application/context/decisions/reverse/IDecisionReversedProjector.js";
import { IDecisionReverseReader } from "../../../../application/context/decisions/reverse/IDecisionReverseReader.js";
import { DecisionReversedEvent } from "../../../../domain/decisions/reverse/DecisionReversedEvent.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export class SqliteDecisionReversedProjector
  implements IDecisionReversedProjector, IDecisionReverseReader
{
  constructor(private db: Database) {}

  async applyDecisionReversed(event: DecisionReversedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE decision_views
      SET status = 'reversed',
          reversalReason = ?,
          reversedAt = ?,
          version = ?,
          updatedAt = ?
      WHERE decisionId = ?
    `);

    stmt.run(
      event.payload.reason,
      event.payload.reversedAt,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
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
