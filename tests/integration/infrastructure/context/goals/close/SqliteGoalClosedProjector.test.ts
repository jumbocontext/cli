/**
 * Tests for SqliteGoalClosedProjector
 *
 * Verifies the SQLite projector for goal closed events
 * properly implements IGoalClosedProjector and IGoalCloseReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalClosedProjector } from "../../../../../../src/infrastructure/context/goals/close/SqliteGoalClosedProjector";
import { IGoalClosedProjector } from "../../../../../../src/application/context/goals/close/IGoalClosedProjector";
import { IGoalCloseReader } from "../../../../../../src/application/context/goals/close/IGoalCloseReader";
import { GoalClosedEvent } from "../../../../../../src/domain/goals/close/GoalClosedEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalClosedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalClosedProjector;

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
    projector = new SqliteGoalClosedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyGoalClosed", () => {
    beforeEach(() => {
      db.prepare(`
        INSERT INTO goal_views (
          goalId, objective, successCriteria, scopeIn, scopeOut,
          status, version, createdAt, updatedAt, progress, claimedBy, claimedAt, claimExpiresAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        "[]",
        "[]",
        "[]",
        GoalStatus.CODIFYING,
        8,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_123",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );
    });

    it("updates goal status to done", async () => {
      const event: GoalClosedEvent = {
        type: GoalEventType.CLOSED,
        aggregateId: "goal_test-1",
        version: 9,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.DONE,
          closedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalClosed(event);

      const row = db.prepare("SELECT status FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string };
      expect(row.status).toBe(GoalStatus.DONE);
    });

    it("clears claim fields when closed", async () => {
      const event: GoalClosedEvent = {
        type: GoalEventType.CLOSED,
        aggregateId: "goal_test-1",
        version: 9,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.DONE,
          closedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalClosed(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });

    it("updates version from event", async () => {
      const event: GoalClosedEvent = {
        type: GoalEventType.CLOSED,
        aggregateId: "goal_test-1",
        version: 9,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.DONE,
          closedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalClosed(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(9);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalClosedEvent = {
        type: GoalEventType.CLOSED,
        aggregateId: "goal_test-1",
        version: 9,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.DONE,
          closedAt: "2026-02-02T15:30:00.000Z",
        },
      };

      await projector.applyGoalClosed(event);

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
        GoalStatus.DONE,
        9,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.objective).toBe("Test objective");
      expect(result!.status).toBe(GoalStatus.DONE);
      expect(result!.successCriteria).toEqual(["criterion 1"]);
      expect(result!.scopeIn).toEqual(["in scope"]);
      expect(result!.scopeOut).toEqual(["out of scope"]);
    });
  });
});
