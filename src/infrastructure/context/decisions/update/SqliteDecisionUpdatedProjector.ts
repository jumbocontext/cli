/**
 * SqliteDecisionUpdatedProjector - SQLite projector for DecisionUpdated event.
 *
 * Implements IDecisionUpdatedProjector and IDecisionUpdateReader for projecting
 * decision update events to the SQLite read model and reading decisions.
 */

import { Database } from "better-sqlite3";
import { IDecisionUpdatedProjector } from "../../../../application/context/decisions/update/IDecisionUpdatedProjector.js";
import { IDecisionUpdateReader } from "../../../../application/context/decisions/update/IDecisionUpdateReader.js";
import { DecisionUpdatedEvent } from "../../../../domain/decisions/update/DecisionUpdatedEvent.js";
import { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export class SqliteDecisionUpdatedProjector
  implements IDecisionUpdatedProjector, IDecisionUpdateReader
{
  constructor(private db: Database) {}

  async applyDecisionUpdated(event: DecisionUpdatedEvent): Promise<void> {
    const current = this.db
      .prepare("SELECT * FROM decision_views WHERE decisionId = ?")
      .get(event.aggregateId) as Record<string, unknown>;

    const stmt = this.db.prepare(`
      UPDATE decision_views
      SET title = ?,
          context = ?,
          rationale = ?,
          alternatives = ?,
          consequences = ?,
          version = ?,
          updatedAt = ?
      WHERE decisionId = ?
    `);

    stmt.run(
      event.payload.title ?? current.title,
      event.payload.context ?? current.context,
      event.payload.rationale !== undefined
        ? event.payload.rationale
        : current.rationale,
      event.payload.alternatives
        ? JSON.stringify(event.payload.alternatives)
        : current.alternatives,
      event.payload.consequences !== undefined
        ? event.payload.consequences
        : current.consequences,
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
