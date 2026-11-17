/**
 * SqliteAudiencePainUpdatedProjector - SQLite projector for AudiencePainUpdatedEvent event.
 *
 * Implements IAudiencePainUpdatedProjector and IAudiencePainUpdateReader for projecting
 * audience pain update events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudiencePainUpdatedProjector } from "../../../../application/context/audience-pains/update/IAudiencePainUpdatedProjector.js";
import { IAudiencePainUpdateReader } from "../../../../application/context/audience-pains/update/IAudiencePainUpdateReader.js";
import { AudiencePainUpdatedEvent } from "../../../../domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import { AudiencePainView } from "../../../../application/context/audience-pains/AudiencePainView.js";
import { AudiencePainStatusType } from "../../../../domain/audience-pains/Constants.js";

export class SqliteAudiencePainUpdatedProjector
  implements IAudiencePainUpdatedProjector, IAudiencePainUpdateReader
{
  constructor(private db: Database) {}

  async applyAudiencePainUpdated(
    event: AudiencePainUpdatedEvent,
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

    if (updates.length > 0) {
      updates.push("version = ?");
      updates.push("updatedAt = ?");
      values.push(event.version, event.timestamp, event.aggregateId);

      const stmt = this.db.prepare(`
        UPDATE audience_pain_views
        SET ${updates.join(", ")}
        WHERE painId = ?
      `);

      stmt.run(...values);
    }
  }

  async findById(id: string): Promise<AudiencePainView | null> {
    const row = this.db
      .prepare("SELECT * FROM audience_pain_views WHERE painId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): AudiencePainView {
    return {
      painId: row.painId as string,
      title: row.title as string,
      description: row.description as string,
      status: row.status as AudiencePainStatusType,
      resolvedAt: row.resolvedAt as string | null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
