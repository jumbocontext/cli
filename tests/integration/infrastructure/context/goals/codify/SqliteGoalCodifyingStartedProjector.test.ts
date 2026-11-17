/**
 * Tests for SqliteGoalCodifyingStartedProjector
 *
 * Verifies the SQLite projector for goal codifying started events
 * properly implements IGoalCodifyingStartedProjector and IGoalCodifyReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalCodifyingStartedProjector } from "../../../../../../src/infrastructure/context/goals/codify/SqliteGoalCodifyingStartedProjector";
import { IGoalCodifyingStartedProjector } from "../../../../../../src/application/context/goals/codify/IGoalCodifyingStartedProjector";
import { IGoalCodifyReader } from "../../../../../../src/application/context/goals/codify/IGoalCodifyReader";
import { GoalCodifyingStartedEvent } from "../../../../../../src/domain/goals/codify/GoalCodifyingStartedEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalCodifyingStartedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalCodifyingStartedProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE goal_views (
        goalId TEXT PRIMARY KEY,
        title TEXT DEFAULT '',
        objective TEXT,
        successCriteria TEXT DEFAULT '[]',
        scopeIn TEXT DEFAULT '[]',
        scopeOut TEXT DEFAULT '[]',
        status TEXT,
        version INTEGER,
        createdAt TEXT,
        updatedAt TEXT,
        note TEXT,
        progress TEXT DEFAULT '[]',
        claimedBy TEXT,
        claimedAt TEXT,
        claimExpiresAt TEXT,
        nextGoalId TEXT,
        prerequisiteGoals TEXT DEFAULT '[]'
      )
    `);
    projector = new SqliteGoalCodifyingStartedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyGoalCodifyingStarted", () => {
    beforeEach(() => {
      db.prepare(`
        INSERT INTO goal_views (
          goalId, objective, successCriteria, scopeIn, scopeOut,
          status, version, createdAt, updatedAt, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        "[]",
        "[]",
        "[]",
        GoalStatus.QUALIFIED,
        7,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]"
      );
    });

    it("updates goal status to codifying and sets claim fields", async () => {
      const event: GoalCodifyingStartedEvent = {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_test-1",
        version: 8,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2026-02-02T10:00:00.000Z",
          claimedBy: "worker_123",
          claimedAt: "2026-02-02T10:00:00.000Z",
          claimExpiresAt: "2026-02-02T10:30:00.000Z",
        },
      };

      await projector.applyGoalCodifyingStarted(event);

      const row = db.prepare("SELECT status, claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string; claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.status).toBe(GoalStatus.CODIFYING);
      expect(row.claimedBy).toBe("worker_123");
      expect(row.claimedAt).toBe("2026-02-02T10:00:00.000Z");
      expect(row.claimExpiresAt).toBe("2026-02-02T10:30:00.000Z");
    });

    it("updates version from event", async () => {
      const event: GoalCodifyingStartedEvent = {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_test-1",
        version: 8,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2026-02-02T10:00:00.000Z",
          claimedBy: "worker_123",
          claimedAt: "2026-02-02T10:00:00.000Z",
          claimExpiresAt: "2026-02-02T10:30:00.000Z",
        },
      };

      await projector.applyGoalCodifyingStarted(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(8);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalCodifyingStartedEvent = {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_test-1",
        version: 8,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2026-02-02T15:30:00.000Z",
          claimedBy: "worker_123",
          claimedAt: "2026-02-02T15:30:00.000Z",
          claimExpiresAt: "2026-02-02T16:00:00.000Z",
        },
      };

      await projector.applyGoalCodifyingStarted(event);

      const row = db.prepare("SELECT updatedAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { updatedAt: string };
      expect(row.updatedAt).toBe("2026-02-02T15:30:00.000Z");
    });
  });

  describe("findById", () => {
    it("returns null for non-existent goal", async () => {
      const result = await projector.findById("goal_nonexistent");
      expect(result).toBeNull();
    });

    it("returns goal view for existing goal", async () => {
      db.prepare(`
        INSERT INTO goal_views (
          goalId, objective, successCriteria, scopeIn, scopeOut,
          status, version, createdAt, updatedAt, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        '["criterion 1"]',
        '["in scope"]',
        '["out of scope"]',
        GoalStatus.CODIFYING,
        8,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.objective).toBe("Test objective");
      expect(result!.status).toBe(GoalStatus.CODIFYING);
      expect(result!.successCriteria).toEqual(["criterion 1"]);
      expect(result!.scopeIn).toEqual(["in scope"]);
      expect(result!.scopeOut).toEqual(["out of scope"]);
    });
  });
});
