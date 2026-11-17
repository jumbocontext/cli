/**
 * SqliteAudienceAddedProjector - SQLite projector for AudienceAddedEvent event.
 *
 * Implements IAudienceAddedProjector for projecting audience add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudienceAddedProjector } from "../../../../application/context/audiences/add/IAudienceAddedProjector.js";
import { AudienceAddedEvent } from "../../../../domain/audiences/add/AudienceAddedEvent.js";

export class SqliteAudienceAddedProjector implements IAudienceAddedProjector {
  constructor(private db: Database) {}

  async applyAudienceAdded(event: AudienceAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO audience_views (
        audienceId, name, description, priority, isRemoved,
        version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.name,
      event.payload.description,
      event.payload.priority,
      0, // isRemoved = false
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }
}
