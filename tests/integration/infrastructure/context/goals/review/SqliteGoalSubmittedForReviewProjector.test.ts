/**
 * Tests for SqliteGoalSubmittedForReviewProjector
 *
 * Verifies the SQLite projector for goal submitted for review events
 * properly implements IGoalSubmittedForReviewProjector and IGoalSubmitForReviewReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalSubmittedForReviewProjector } from "../../../../../../src/infrastructure/context/goals/review/SqliteGoalSubmittedForReviewProjector";
import { IGoalSubmittedForReviewProjector } from "../../../../../../src/application/context/goals/review/IGoalSubmittedForReviewProjector";
import { IGoalSubmitForReviewReader } from "../../../../../../src/application/context/goals/review/IGoalSubmitForReviewReader";
import { GoalSubmittedForReviewEvent } from "../../../../../../src/domain/goals/review/GoalSubmittedForReviewEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalSubmittedForReviewProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalSubmittedForReviewProjector;

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
    projector = new SqliteGoalSubmittedForReviewProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("interface compliance", () => {
    it("implements IGoalSubmittedForReviewProjector", () => {
      const projectorInterface: IGoalSubmittedForReviewProjector = projector;
      expect(projectorInterface.applyGoalSubmittedForReview).toBeDefined();
    });

    it("implements IGoalSubmitForReviewReader", () => {
      const readerInterface: IGoalSubmitForReviewReader = projector;
      expect(readerInterface.findById).toBeDefined();
    });
  });

  describe("applyGoalSubmittedForReview", () => {
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
        1,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_123",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );
    });

    it("updates goal status to in-review", async () => {
      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmittedForReview(event);

      const row = db.prepare("SELECT status FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string };
      expect(row.status).toBe(GoalStatus.INREVIEW);
    });

    it("sets reviewer claim fields when submitted for review with claim info", async () => {
      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2026-02-02T10:00:00.000Z",
          claimedBy: "reviewer_456",
          claimedAt: "2026-02-02T10:00:00.000Z",
          claimExpiresAt: "2026-02-02T12:00:00.000Z",
        },
      };

      await projector.applyGoalSubmittedForReview(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBe("reviewer_456");
      expect(row.claimedAt).toBe("2026-02-02T10:00:00.000Z");
      expect(row.claimExpiresAt).toBe("2026-02-02T12:00:00.000Z");
    });

    it("clears claim fields when submitted for review without claim info", async () => {
      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmittedForReview(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });

    it("updates version from event", async () => {
      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_test-1",
        version: 5,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalSubmittedForReview(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(5);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalSubmittedForReviewEvent = {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2026-02-02T15:30:00.000Z",
        },
      };

      await projector.applyGoalSubmittedForReview(event);

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
        GoalStatus.INREVIEW,
        2,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.objective).toBe("Test objective");
      expect(result!.status).toBe(GoalStatus.INREVIEW);
      expect(result!.successCriteria).toEqual(["criterion 1"]);
      expect(result!.scopeIn).toEqual(["in scope"]);
      expect(result!.scopeOut).toEqual(["out of scope"]);
    });

    it("parses JSON fields correctly", async () => {
      db.prepare(`
        INSERT INTO goal_views (
          goalId, objective, successCriteria, scopeIn, scopeOut,
          status, version, createdAt, updatedAt, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        '["a","b","c"]',
        '["x"]',
        '["y"]',
        GoalStatus.TODO,
        1,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        '["done task 1"]'
      );

      const result = await projector.findById("goal_test-1");

      expect(result!.successCriteria).toEqual(["a", "b", "c"]);
      expect(result!.scopeIn).toEqual(["x"]);
      expect(result!.scopeOut).toEqual(["y"]);
      expect(result!.progress).toEqual(["done task 1"]);
    });

    it("handles optional claim fields", async () => {
      db.prepare(`
        INSERT INTO goal_views (
          goalId, objective, successCriteria, scopeIn, scopeOut,
          status, version, createdAt, updatedAt, progress,
          claimedBy, claimedAt, claimExpiresAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "goal_test-1",
        "Test objective",
        "[]",
        "[]",
        "[]",
        GoalStatus.DOING,
        1,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_abc",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );

      const result = await projector.findById("goal_test-1");

      expect(result!.claimedBy).toBe("worker_abc");
      expect(result!.claimedAt).toBe("2026-02-01T10:00:00.000Z");
      expect(result!.claimExpiresAt).toBe("2026-02-01T10:30:00.000Z");
    });

    it("returns undefined for null optional fields", async () => {
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
        GoalStatus.TODO,
        1,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result!.note).toBeUndefined();
      expect(result!.claimedBy).toBeUndefined();
      expect(result!.claimedAt).toBeUndefined();
      expect(result!.claimExpiresAt).toBeUndefined();
      expect(result!.nextGoalId).toBeUndefined();
    });
  });
});
