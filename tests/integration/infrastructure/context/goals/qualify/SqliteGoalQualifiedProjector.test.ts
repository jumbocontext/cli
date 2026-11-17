/**
 * Tests for SqliteGoalQualifiedProjector
 *
 * Verifies the SQLite projector for goal qualified events
 * properly implements IGoalQualifiedProjector and IGoalQualifyReader.
 */

import Database from "better-sqlite3";
import { SqliteGoalQualifiedProjector } from "../../../../../../src/infrastructure/context/goals/qualify/SqliteGoalQualifiedProjector";
import { IGoalQualifiedProjector } from "../../../../../../src/application/context/goals/qualify/IGoalQualifiedProjector";
import { IGoalQualifyReader } from "../../../../../../src/application/context/goals/qualify/IGoalQualifyReader";
import { GoalQualifiedEvent } from "../../../../../../src/domain/goals/qualify/GoalQualifiedEvent";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";

describe("SqliteGoalQualifiedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalQualifiedProjector;

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
    projector = new SqliteGoalQualifiedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("interface compliance", () => {
    it("implements IGoalQualifiedProjector", () => {
      const projectorInterface: IGoalQualifiedProjector = projector;
      expect(projectorInterface.applyGoalQualified).toBeDefined();
    });

    it("implements IGoalQualifyReader", () => {
      const readerInterface: IGoalQualifyReader = projector;
      expect(readerInterface.findById).toBeDefined();
    });
  });

  describe("applyGoalQualified", () => {
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
        2,
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:00:00.000Z",
        "[]",
        "worker_123",
        "2026-02-01T10:00:00.000Z",
        "2026-02-01T10:30:00.000Z"
      );
    });

    it("updates goal status to qualified", async () => {
      const event: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_test-1",
        version: 3,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalQualified(event);

      const row = db.prepare("SELECT status FROM goal_views WHERE goalId = ?").get("goal_test-1") as { status: string };
      expect(row.status).toBe(GoalStatus.QUALIFIED);
    });

    it("clears claim fields when qualified", async () => {
      const event: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_test-1",
        version: 3,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalQualified(event);

      const row = db.prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?").get("goal_test-1") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };
      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });

    it("updates version from event", async () => {
      const event: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_test-1",
        version: 5,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await projector.applyGoalQualified(event);

      const row = db.prepare("SELECT version FROM goal_views WHERE goalId = ?").get("goal_test-1") as { version: number };
      expect(row.version).toBe(5);
    });

    it("updates updatedAt from event timestamp", async () => {
      const event: GoalQualifiedEvent = {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_test-1",
        version: 3,
        timestamp: "2026-02-02T15:30:00.000Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2026-02-02T15:30:00.000Z",
        },
      };

      await projector.applyGoalQualified(event);

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
        GoalStatus.QUALIFIED,
        3,
        "2026-02-01T10:00:00.000Z",
        "2026-02-02T10:00:00.000Z",
        "[]"
      );

      const result = await projector.findById("goal_test-1");

      expect(result).not.toBeNull();
      expect(result!.goalId).toBe("goal_test-1");
      expect(result!.objective).toBe("Test objective");
      expect(result!.status).toBe(GoalStatus.QUALIFIED);
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
