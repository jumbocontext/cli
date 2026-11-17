/**
 * SqliteWorkerIdentifiedProjector - SQLite projector for WorkerIdentifiedEvent.
 *
 * Implements IWorkerIdentifiedProjector for projecting worker identified events
 * to the SQLite read model. INSERTs new workers or UPDATEs lastSeenAt for existing ones.
 */

import { Database } from "better-sqlite3";
import { IWorkerIdentifiedProjector } from "../../../../application/host/workers/identify/IWorkerIdentifiedProjector.js";
import { WorkerIdentifiedEvent } from "../../../../domain/workers/identify/WorkerIdentifiedEvent.js";

export class SqliteWorkerIdentifiedProjector implements IWorkerIdentifiedProjector {
  constructor(private readonly db: Database) {}

  async applyWorkerIdentified(event: WorkerIdentifiedEvent): Promise<void> {
    const existing = this.db
      .prepare("SELECT workerId FROM workers WHERE hostSessionKey = ?")
      .get(event.payload.hostSessionKey) as { workerId: string } | undefined;

    if (existing) {
      this.db
        .prepare("UPDATE workers SET lastSeenAt = ? WHERE hostSessionKey = ?")
        .run(event.timestamp, event.payload.hostSessionKey);
    } else {
      this.db
        .prepare(
          "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          event.aggregateId,
          event.payload.hostSessionKey,
          event.payload.mode,
          event.timestamp,
          event.timestamp,
        );
    }
  }
}
