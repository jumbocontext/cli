/**
 * SqliteSessionEndedProjector - SQLite projector for SessionEnded event.
 *
 * Implements ISessionEndedProjector for projecting session end events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { ISessionEndedProjector } from "../../../../application/context/sessions/end/ISessionEndedProjector.js";
import { SessionEndedEvent } from "../../../../domain/sessions/end/SessionEndedEvent.js";
import { SessionStatus } from "../../../../domain/sessions/Constants.js";

export class SqliteSessionEndedProjector implements ISessionEndedProjector {
  constructor(private db: Database) {}

  async applySessionEnded(event: SessionEndedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE session_views
      SET focus = ?,
          status = ?,
          endedAt = ?,
          version = ?,
          updatedAt = ?
      WHERE sessionId = ?
    `);

    stmt.run(
      event.payload.focus,
      SessionStatus.ENDED,
      event.timestamp,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }
}
