/**
 * Tests for SqliteWorkerIdentifiedProjector
 *
 * Verifies the SQLite projector for worker identified events
 * properly implements IWorkerIdentifiedProjector.
 */

import Database from "better-sqlite3";
import { SqliteWorkerIdentifiedProjector } from "../../../../../../src/infrastructure/host/workers/identify/SqliteWorkerIdentifiedProjector";
import { WorkerEventType, WorkerIdentifiedEvent } from "../../../../../../src/domain/workers/identify/WorkerIdentifiedEvent";

function createWorkersTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      workerId TEXT PRIMARY KEY,
      hostSessionKey TEXT NOT NULL UNIQUE,
      mode TEXT,
      createdAt TEXT NOT NULL,
      lastSeenAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_workers_host_session_key ON workers(hostSessionKey);
  `);
}

describe("SqliteWorkerIdentifiedProjector", () => {
  let db: Database.Database;
  let projector: SqliteWorkerIdentifiedProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    createWorkersTable(db);
    projector = new SqliteWorkerIdentifiedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyWorkerIdentified", () => {
    it("inserts new worker when not existing", async () => {
      const event: WorkerIdentifiedEvent = {
        type: WorkerEventType.IDENTIFIED,
        aggregateId: "worker_new-1",
        version: 1,
        timestamp: "2026-03-01T10:00:00.000Z",
        payload: {
          hostSessionKey: "session-key-abc",
          mode: null,
        },
      };

      await projector.applyWorkerIdentified(event);

      const row = db
        .prepare("SELECT workerId, hostSessionKey, mode, createdAt, lastSeenAt FROM workers WHERE hostSessionKey = ?")
        .get("session-key-abc") as { workerId: string; hostSessionKey: string; mode: string | null; createdAt: string; lastSeenAt: string };

      expect(row).toBeDefined();
      expect(row.workerId).toBe("worker_new-1");
      expect(row.hostSessionKey).toBe("session-key-abc");
      expect(row.mode).toBeNull();
      expect(row.createdAt).toBe("2026-03-01T10:00:00.000Z");
      expect(row.lastSeenAt).toBe("2026-03-01T10:00:00.000Z");
    });

    it("inserts new worker with mode", async () => {
      const event: WorkerIdentifiedEvent = {
        type: WorkerEventType.IDENTIFIED,
        aggregateId: "worker_with-mode",
        version: 1,
        timestamp: "2026-03-01T10:00:00.000Z",
        payload: {
          hostSessionKey: "session-key-mode",
          mode: "implement",
        },
      };

      await projector.applyWorkerIdentified(event);

      const row = db
        .prepare("SELECT mode FROM workers WHERE hostSessionKey = ?")
        .get("session-key-mode") as { mode: string | null };

      expect(row.mode).toBe("implement");
    });

    it("updates lastSeenAt for existing worker", async () => {
      // Seed existing worker
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_existing", "session-key-existing", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const event: WorkerIdentifiedEvent = {
        type: WorkerEventType.IDENTIFIED,
        aggregateId: "worker_existing",
        version: 1,
        timestamp: "2026-03-01T12:00:00.000Z",
        payload: {
          hostSessionKey: "session-key-existing",
          mode: null,
        },
      };

      await projector.applyWorkerIdentified(event);

      const row = db
        .prepare("SELECT createdAt, lastSeenAt FROM workers WHERE hostSessionKey = ?")
        .get("session-key-existing") as { createdAt: string; lastSeenAt: string };

      expect(row.createdAt).toBe("2026-03-01T08:00:00.000Z");
      expect(row.lastSeenAt).toBe("2026-03-01T12:00:00.000Z");
    });

    it("does not change workerId for existing worker", async () => {
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_original", "session-key-stable", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const event: WorkerIdentifiedEvent = {
        type: WorkerEventType.IDENTIFIED,
        aggregateId: "worker_original",
        version: 1,
        timestamp: "2026-03-01T12:00:00.000Z",
        payload: {
          hostSessionKey: "session-key-stable",
          mode: null,
        },
      };

      await projector.applyWorkerIdentified(event);

      const row = db
        .prepare("SELECT workerId FROM workers WHERE hostSessionKey = ?")
        .get("session-key-stable") as { workerId: string };

      expect(row.workerId).toBe("worker_original");
    });
  });
});
