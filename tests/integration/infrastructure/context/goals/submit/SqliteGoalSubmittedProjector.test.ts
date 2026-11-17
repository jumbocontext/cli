/**
 * Tests for SqliteGoalSubmittedProjector
 *
 * Verifies the SQLite projector for goal submitted events
 * properly implements IGoalSubmittedProjector and IGoalSubmitReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalSubmittedProjector } from "../../../../../../src/infrastructure/context/goals/submit/SqliteGoalSubmittedProjector";
import { IGoalSubmittedProjector } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedProjector";
import { IGoalSubmitReader } from "../../../../../../src/application/context/goals/submit/IGoalSubmitReader";
import { GoalSubmittedEvent } from "../../../../../../src/domain/goals/submit/GoalSubmittedEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalSubmittedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalSubmittedProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE goal_views (
        goalId TEXT PRIMARY KEY,
        objective TEXT NOT NULL,
        successCriteria TEXT NOT NULL,
        scopeIn TEXT NOT NULL,
        scopeOut TEXT NOT NULL,
        status TEXT NOT NULL,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        note TEXT,
        progress TEXT NOT NULL DEFAULT '[]',
        claimedBy TEXT,
        claimedAt TEXT,
        claimExpiresAt TEXT,
        nextGoalId TEXT
      )
    `);
    projector = new SqliteGoalSubmittedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("interface compliance", () => {
    it("implements IGoalSubmittedProjector", () => {
      const projectorInterface: IGoalSubmittedProjector = projector;
      expect(projectorInterface.applyGoalSubmitted).toBeDefined();
    });

    it("implements IGoalSubmitReader", () => {
      const readerInterface: IGoalSubmitReader = projector;
      expect(readerInterface.findById).toBeDefined();
    });
  });

  describe("applyGoalSubmitted", () => {
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
        GoalStatus.DOING,
        3,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_123",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );
    });

    it("updates goal status to submitted", async () => {
      const event: GoalSubmittedEvent = {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_test-1",
        version: 4,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmitted(event);

      const row = db.prepare("SELECT status FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string };
      expect(row.status).toBe(GoalStatus.SUBMITTED);
    });

    it("clears claim fields when goal is submitted", async () => {
      const event: GoalSubmittedEvent = {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_test-1",
        version: 4,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmitted(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });

    it("updates version from event", async () => {
      const event: GoalSubmittedEvent = {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_test-1",
        version: 4,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmitted(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(4);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalSubmittedEvent = {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_test-1",
        version: 4,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2026-02-02T15:30:00.000Z",
        },
      };

      await projector.applyGoalSubmitted(event);

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
        GoalStatus.SUBMITTED,
        4,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.objective).toBe("Test objective");
      expect(result!.status).toBe(GoalStatus.SUBMITTED);
      expect(result!.successCriteria).toEqual(["criterion 1"]);
    });
  });
});
