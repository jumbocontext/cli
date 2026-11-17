import Database from "better-sqlite3";
import { SqliteWorkerIdentityRegistry } from "../../../../../src/infrastructure/host/workers/SqliteWorkerIdentityRegistry";
import { HostSessionKeyResolver, HostSessionKeyResult } from "../../../../../src/infrastructure/host/session/HostSessionKeyResolver";
import { IWorkerIdentifiedEventWriter } from "../../../../../src/application/host/workers/identify/IWorkerIdentifiedEventWriter";
import { InProcessEventBus } from "../../../../../src/infrastructure/messaging/InProcessEventBus";
import { SqliteWorkerIdentifiedProjector } from "../../../../../src/infrastructure/host/workers/identify/SqliteWorkerIdentifiedProjector";
import { WorkerIdentifiedEventHandler } from "../../../../../src/application/host/workers/identify/WorkerIdentifiedEventHandler";
import { jest } from "@jest/globals";

class MockHostSessionKeyResolver extends HostSessionKeyResolver {
  constructor(private readonly mockKey: string) {
    super();
  }

  override resolve(): HostSessionKeyResult {
    return {
      key: this.mockKey,
      parts: [{ source: "MOCK", value: this.mockKey }],
    };
  }
}

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

function createMockEventWriter(): jest.Mocked<IWorkerIdentifiedEventWriter> {
  return {
    append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
  };
}

describe("SqliteWorkerIdentityRegistry", () => {
  let db: Database.Database;
  let eventWriter: jest.Mocked<IWorkerIdentifiedEventWriter>;
  let eventBus: InProcessEventBus;

  beforeEach(() => {
    db = new Database(":memory:");
    createWorkersTable(db);
    eventWriter = createMockEventWriter();
    eventBus = new InProcessEventBus();
    const projector = new SqliteWorkerIdentifiedProjector(db);
    eventBus.subscribe("WorkerIdentifiedEvent", new WorkerIdentifiedEventHandler(projector));
  });

  afterEach(() => {
    db.close();
  });

  it("throws a descriptive error when workerId is accessed before initialize()", () => {
    const resolver = new MockHostSessionKeyResolver("session-pre-init");
    const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

    expect(() => registry.workerId).toThrow(
      "SqliteWorkerIdentityRegistry is not initialized. Call await initialize() before accessing workerId."
    );
  });

  it("persists worker mapping through event bus projection during initialize()", async () => {
    const resolver = new MockHostSessionKeyResolver("session-init-mapping");
    const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

    await registry.initialize();
    const workerId = registry.workerId;

    const row = db
      .prepare("SELECT workerId, hostSessionKey FROM workers WHERE hostSessionKey = ?")
      .get("session-init-mapping") as { workerId: string; hostSessionKey: string } | undefined;

    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    expect(row).toEqual({
      workerId,
      hostSessionKey: "session-init-mapping",
    });
  });

  it("returns same workerId on repeated reads after initialize()", async () => {
    const resolver = new MockHostSessionKeyResolver("session-stable-id");
    const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

    await registry.initialize();

    const first = registry.workerId;
    const second = registry.workerId;
    const third = registry.workerId;

    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it("reuses existing worker mapping on initialize() for same host session key", async () => {
    const sessionKey = "session-existing-mapping";
    db.prepare("INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)")
      .run("worker_existing", sessionKey, "plan", "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

    const registry = new SqliteWorkerIdentityRegistry(
      db,
      new MockHostSessionKeyResolver(sessionKey),
      eventWriter,
      eventBus
    );

    await registry.initialize();

    expect(registry.workerId).toBe("worker_existing");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
  });

  it("supports mode updates after initialize()", async () => {
    const resolver = new MockHostSessionKeyResolver("session-mode");
    const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

    await registry.initialize();
    registry.setMode("review");

    expect(registry.getMode()).toBe("review");
  });
});
