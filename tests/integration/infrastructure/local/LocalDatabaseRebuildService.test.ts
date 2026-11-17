import fs from "fs-extra";
import * as path from "path";
import Database from "better-sqlite3";
import { ILogger } from "../../../../src/application/logging/ILogger";
import { LocalDatabaseRebuildService } from "../../../../src/infrastructure/local/LocalDatabaseRebuildService";
import { ProjectionBusFactory } from "../../../../src/infrastructure/messaging/ProjectionBusFactory";
import { FsEventStore } from "../../../../src/infrastructure/persistence/FsEventStore";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";
import { WorkerEventType } from "../../../../src/domain/workers/identify/WorkerIdentifiedEvent";
import { SqliteWorkerIdentityRegistry } from "../../../../src/infrastructure/host/workers/SqliteWorkerIdentityRegistry";
import { HostSessionKeyResolver, HostSessionKeyResult } from "../../../../src/infrastructure/host/session/HostSessionKeyResolver";
import { IWorkerIdentifiedEventWriter } from "../../../../src/application/host/workers/identify/IWorkerIdentifiedEventWriter";
import { IEventBus } from "../../../../src/application/messaging/IEventBus";
import { SqliteGoalClaimStore } from "../../../../src/infrastructure/context/goals/claims/SqliteGoalClaimStore";
import { GoalClaimPolicy } from "../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { CommitGoalCommandHandler } from "../../../../src/application/context/goals/commit/CommitGoalCommandHandler";
import { SqliteGoalCommittedProjector } from "../../../../src/infrastructure/context/goals/commit/SqliteGoalCommittedProjector";
import { GoalContextQueryHandler } from "../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { jest } from "@jest/globals";
import os from "os";

class MockHostSessionKeyResolver extends HostSessionKeyResolver {
  constructor(private readonly sessionKey: string) {
    super();
  }

  override resolve(): HostSessionKeyResult {
    return {
      key: this.sessionKey,
      parts: [{ source: "MOCK", value: this.sessionKey }],
    };
  }
}

function createMockEventWriter(): jest.Mocked<IWorkerIdentifiedEventWriter> {
  return {
    append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
  };
}

function createMockEventBus(): jest.Mocked<IEventBus> {
  return {
    subscribe: jest.fn(),
    publish: jest.fn().mockResolvedValue(undefined),
  };
}

jest.setTimeout(30_000);

describe("LocalDatabaseRebuildService", () => {
  let tmpDir: string;
  let dbPath: string;
  let initialDb: Database.Database;
  let eventStore: FsEventStore;
  const mockLogger: ILogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };

  const workerId = "worker-uuid-123";
  const hostSessionKey = "host-session-key-123";
  const goalId = "goal_rebuild_claim";

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-rebuild-"));
    dbPath = path.join(tmpDir, "jumbo.db");
    initialDb = new Database(dbPath);
    initialDb.pragma("journal_mode = WAL");
    eventStore = new FsEventStore(tmpDir, mockLogger);
  });

  afterEach(async () => {
    if (initialDb && initialDb.open) {
      initialDb.close();
    }
    await fs.remove(tmpDir);
  });

  it("replays WorkerIdentifiedEvent into workers table during rebuild", async () => {
    await eventStore.append({
      type: WorkerEventType.IDENTIFIED,
      aggregateId: workerId,
      version: 1,
      timestamp: "2026-03-02T10:00:00.000Z",
      payload: {
        hostSessionKey,
        mode: null,
      },
    });

    const projectionBusFactory = new ProjectionBusFactory();
    const service = new LocalDatabaseRebuildService(tmpDir, initialDb, eventStore, (db) => projectionBusFactory.create(db), mockLogger);
    const result = await service.rebuild();

    expect(result.success).toBe(true);
    expect(result.eventsReplayed).toBe(1);

    const rebuiltDb = new Database(dbPath);
    const row = rebuiltDb
      .prepare("SELECT workerId, hostSessionKey, mode FROM workers WHERE hostSessionKey = ?")
      .get(hostSessionKey) as { workerId: string; hostSessionKey: string; mode: string | null } | undefined;

    expect(row).toBeDefined();
    expect(row?.workerId).toBe(workerId);
    expect(row?.hostSessionKey).toBe(hostSessionKey);
    expect(row?.mode).toBeNull();
    rebuiltDb.close();
  });

  it("preserves refine claim ownership across rebuild so commit in same session succeeds", async () => {
    await eventStore.append({
      type: WorkerEventType.IDENTIFIED,
      aggregateId: workerId,
      version: 1,
      timestamp: "2026-03-02T10:00:00.000Z",
      payload: {
        hostSessionKey,
        mode: null,
      },
    });

    await eventStore.append({
      type: GoalEventType.ADDED,
      aggregateId: goalId,
      version: 1,
      timestamp: "2026-03-02T10:01:00.000Z",
      payload: {
        title: "Test Goal",
        objective: "Verify claim ownership survives rebuild",
        successCriteria: ["Commit works in same session after rebuild"],
        scopeIn: [],
        scopeOut: [],
        status: GoalStatus.TODO,
      },
    });

    await eventStore.append({
      type: GoalEventType.REFINEMENT_STARTED,
      aggregateId: goalId,
      version: 2,
      timestamp: "2026-03-02T10:02:00.000Z",
      payload: {
        status: GoalStatus.IN_REFINEMENT,
        refinementStartedAt: "2026-03-02T10:02:00.000Z",
        claimedBy: workerId,
        claimedAt: "2026-03-02T10:02:00.000Z",
        claimExpiresAt: "2026-03-02T12:02:00.000Z",
      },
    });

    const projectionBusFactory = new ProjectionBusFactory();
    const service = new LocalDatabaseRebuildService(tmpDir, initialDb, eventStore, (db) => projectionBusFactory.create(db), mockLogger);
    const result = await service.rebuild();

    expect(result.success).toBe(true);
    expect(result.eventsReplayed).toBe(3);

    const rebuiltDb = new Database(dbPath);
    const resolver = new MockHostSessionKeyResolver(hostSessionKey);
    const workerIdentityReader = new SqliteWorkerIdentityRegistry(
      rebuiltDb,
      resolver,
      createMockEventWriter(),
      createMockEventBus()
    );
    await workerIdentityReader.initialize();

    expect(workerIdentityReader.workerId).toBe(workerId);

    const claimStore = new SqliteGoalClaimStore(rebuiltDb);
    const claimPolicy = new GoalClaimPolicy(claimStore, {
      nowIso: () => "2026-03-02T10:10:00.000Z",
    });

    const commitReader = new SqliteGoalCommittedProjector(rebuiltDb);
    const publishBus = createMockEventBus();
    const goalContextQueryHandler = {
      execute: jest.fn().mockResolvedValue({
        goal: {
          goalId,
          status: GoalStatus.REFINED,
        },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
        },
      }),
    } as unknown as GoalContextQueryHandler;

    const handler = new CommitGoalCommandHandler(
      eventStore,
      eventStore,
      commitReader,
      publishBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );

    await expect(handler.execute({ goalId })).resolves.toBeDefined();
    expect(publishBus.publish).toHaveBeenCalledTimes(1);
    expect(claimStore.getClaim(goalId)).toBeNull();
    rebuiltDb.close();
  });
});
