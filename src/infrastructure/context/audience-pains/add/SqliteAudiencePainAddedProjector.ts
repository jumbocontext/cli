/**
 * SqliteAudiencePainAddedProjector - SQLite projector for AudiencePainAddedEvent event.
 *
 * Implements IAudiencePainAddedProjector for projecting audience pain add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudiencePainAddedProjector } from "../../../../application/context/audience-pains/add/IAudiencePainAddedProjector.js";
import { AudiencePainAddedEvent } from "../../../../domain/audience-pains/add/AudiencePainAddedEvent.js";
import { AudiencePainStatus } from "../../../../domain/audience-pains/Constants.js";

export class SqliteAudiencePainAddedProjector implements IAudiencePainAddedProjector {
  constructor(private db: Database) {}

  async applyAudiencePainAdded(event: AudiencePainAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO audience_pain_views (
        painId, title, description, status, resolvedAt, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.description,
      AudiencePainStatus.ACTIVE,
      null,
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }
}
