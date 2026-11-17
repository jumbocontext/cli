/**
 * SqliteSessionStartedProjector - SQLite projector for SessionStarted event.
 *
 * Implements ISessionStartedProjector for projecting session start events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { ISessionStartedProjector } from "../../../../application/context/sessions/start/ISessionStartedProjector.js";
import { SessionStartedEvent } from "../../../../domain/sessions/start/SessionStartedEvent.js";

export class SqliteSessionStartedProjector implements ISessionStartedProjector {
  constructor(private db: Database) {}

  async applySessionStarted(event: SessionStartedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO session_views (
        sessionId, focus, status, contextSnapshot,
        version, startedAt, endedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      null, // Focus is set at session end, not start
      "active",
      null, // No context snapshot anymore
      event.version,
      event.timestamp,
      null,
      event.timestamp,
      event.timestamp,
    );
  }
}
