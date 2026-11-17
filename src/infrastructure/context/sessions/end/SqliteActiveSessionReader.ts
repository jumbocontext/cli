/**
 * SqliteActiveSessionReader - SQLite reader for active session.
 *
 * Implements IActiveSessionReader for finding the currently active session
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IActiveSessionReader } from "../../../../application/context/sessions/end/IActiveSessionReader.js";
import { SessionView } from "../../../../application/context/sessions/SessionView.js";

/**
 * Raw shape of a session_views row as selected by this reader. The narrowing
 * from the driver's `unknown` row happens once, at the `.get()` boundary below.
 */
interface SessionViewRow {
  readonly sessionId: string;
  readonly focus: string | null;
  readonly status: SessionView["status"];
  readonly contextSnapshot: string | null;
  readonly version: number;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class SqliteActiveSessionReader implements IActiveSessionReader {
  constructor(private db: Database) {}

  async findActive(): Promise<SessionView | null> {
    const row = this.db
      .prepare(
        "SELECT * FROM session_views WHERE status IN ('active', 'paused') ORDER BY createdAt DESC LIMIT 1",
      )
      .get() as SessionViewRow | undefined;
    return row ? this.mapRowToView(row) : null;
  }

  private mapRowToView(row: SessionViewRow): SessionView {
    return {
      sessionId: row.sessionId,
      focus: row.focus ?? null,
      status: row.status,
      contextSnapshot: row.contextSnapshot ?? null,
      version: row.version,
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
