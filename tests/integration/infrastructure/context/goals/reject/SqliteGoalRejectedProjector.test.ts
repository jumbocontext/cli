/**
 * Tests for SqliteGoalRejectedProjector
 *
 * Verifies the SQLite projector for goal rejected events
 * properly implements IGoalRejectedProjector and IGoalRejectReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalRejectedProjector } from "../../../../../../src/infrastructure/context/goals/reject/SqliteGoalRejectedProjector";
import { GoalRejectedEvent } from "../../../../../../src/domain/goals/reject/GoalRejectedEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalRejectedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalRejectedProjector;

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
        reviewIssues TEXT,
        progress TEXT DEFAULT '[]',
        claimedBy TEXT,
        claimedAt TEXT,
        claimExpiresAt TEXT,
        nextGoalId TEXT,
        prerequisiteGoals TEXT DEFAULT '[]'
      )
    `);
    projector = new SqliteGoalRejectedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyGoalRejected", () => {
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
        GoalStatus.INREVIEW,
        5,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_reviewer",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );
    });

    it("updates goal status to rejected", async () => {
      const event: GoalRejectedEvent = {
        type: GoalEventType.REJECTED,
        aggregateId: "goal_test-1",
        version: 6,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.REJECTED,
          rejectedAt: "2026-02-02T10:00:00.000Z",
          reviewIssues: "Missing error handling",
        },
      };

      await projector.applyGoalRejected(event);

      const row = db.prepare("SELECT status FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string };
      expect(row.status).toBe(GoalStatus.REJECTED);
    });

    it("writes reviewIssues to the dedicated column", async () => {
      const event: GoalRejectedEvent = {
        type: GoalEventType.REJECTED,
        aggregateId: "goal_test-1",
        version: 6,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.REJECTED,
          rejectedAt: "2026-02-02T10:00:00.000Z",
          reviewIssues: "Tests failing in auth module",
        },
      };

      await projector.applyGoalRejected(event);

      const row = db.prepare("SELECT reviewIssues, note FROM goal_views WHERE goalId = ?").get("goal_test-1") as { reviewIssues: string | null; note: string | null };
      expect(row.reviewIssues).toBe("Tests failing in auth module");
      expect(row.note).toBeNull();
    });

    it("clears claim fields when rejected", async () => {
      const event: GoalRejectedEvent = {
        type: GoalEventType.REJECTED,
        aggregateId: "goal_test-1",
        version: 6,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.REJECTED,
          rejectedAt: "2026-02-02T10:00:00.000Z",
          reviewIssues: "Missing error handling",
        },
      };

      await projector.applyGoalRejected(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });

    it("updates version from event", async () => {
      const event: GoalRejectedEvent = {
        type: GoalEventType.REJECTED,
        aggregateId: "goal_test-1",
        version: 6,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.REJECTED,
          rejectedAt: "2026-02-02T10:00:00.000Z",
          reviewIssues: "Missing error handling",
        },
      };

      await projector.applyGoalRejected(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(6);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalRejectedEvent = {
        type: GoalEventType.REJECTED,
        aggregateId: "goal_test-1",
        version: 6,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.REJECTED,
          rejectedAt: "2026-02-02T15:30:00.000Z",
          reviewIssues: "Missing error handling",
        },
      };

      await projector.applyGoalRejected(event);

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
          status, version, createdAt, updatedAt, progress, reviewIssues
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        '["criterion 1"]',
        '["in scope"]',
        '["out of scope"]',
        GoalStatus.REJECTED,
        6,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]",
        "Tests failing in auth module"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.status).toBe(GoalStatus.REJECTED);
      expect(result!.reviewIssues).toBe("Tests failing in auth module");
    });
  });
});
