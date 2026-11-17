/**
 * Tests for SqliteGoalClaimStore
 */

import Database from "better-sqlite3";
import { SqliteGoalClaimStore } from "../../../../../../src/infrastructure/context/goals/claims/SqliteGoalClaimStore";
import { GoalClaim } from "../../../../../../src/application/context/goals/claims/GoalClaim";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";

describe("SqliteGoalClaimStore", () => {
  let db: Database.Database;
  let store: SqliteGoalClaimStore;

  const workerA = createWorkerId("worker-a-uuid");
  const workerB = createWorkerId("worker-b-uuid");

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
        note TEXT,
        progress TEXT NOT NULL DEFAULT '[]',
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        prerequisiteGoals TEXT,
        nextGoalId TEXT,
        claimedBy TEXT,
        claimedAt TEXT,
        claimExpiresAt TEXT
      )
    `);
    store = new SqliteGoalClaimStore(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertGoal(goalId: string): void {
    db.prepare(`
      INSERT INTO goal_views (goalId, objective, successCriteria, scopeIn, scopeOut, status, progress, version, createdAt, updatedAt, title)
      VALUES (?, 'test', '[]', '[]', '[]', 'defined', '[]', 1, '2025-01-15T10:00:00.000Z', '2025-01-15T10:00:00.000Z', 'test')
    `).run(goalId);
  }

  describe("getClaim", () => {
    it("returns null when goal does not exist", () => {
      const claim = store.getClaim("goal_nonexistent");

      expect(claim).toBeNull();
    });

    it("returns null when goal exists but has no claim", () => {
      insertGoal("goal_123");

      const claim = store.getClaim("goal_123");

      expect(claim).toBeNull();
    });

    it("returns stored claim after setClaim", () => {
      insertGoal("goal_123");
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);
      const retrieved = store.getClaim("goal_123");

      expect(retrieved).toEqual(claim);
    });
  });

  describe("setClaim", () => {
    it("persists claim columns in goal_views row", () => {
      insertGoal("goal_123");
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);

      const row = db
        .prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?")
        .get("goal_123") as { claimedBy: string; claimedAt: string; claimExpiresAt: string };

      expect(row.claimedBy).toBe("worker-a-uuid");
      expect(row.claimedAt).toBe("2025-01-15T10:00:00.000Z");
      expect(row.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");
    });

    it("updates existing claim for same goalId", () => {
      insertGoal("goal_123");
      const originalClaim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const updatedClaim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z",
      };

      store.setClaim(originalClaim);
      store.setClaim(updatedClaim);

      const retrieved = store.getClaim("goal_123");
      expect(retrieved?.claimExpiresAt).toBe("2025-01-15T11:00:00.000Z");
    });

    it("stores claims for different goals independently", () => {
      insertGoal("goal_123");
      insertGoal("goal_456");

      const claim1: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const claim2: GoalClaim = {
        goalId: "goal_456",
        claimedBy: workerB,
        claimedAt: "2025-01-15T10:05:00.000Z",
        claimExpiresAt: "2025-01-15T10:35:00.000Z",
      };

      store.setClaim(claim1);
      store.setClaim(claim2);

      expect(store.getClaim("goal_123")).toEqual(claim1);
      expect(store.getClaim("goal_456")).toEqual(claim2);
    });
  });

  describe("releaseClaim", () => {
    it("removes existing claim", () => {
      insertGoal("goal_123");
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);
      store.releaseClaim("goal_123");

      expect(store.getClaim("goal_123")).toBeNull();
    });

    it("does not affect other claims", () => {
      insertGoal("goal_123");
      insertGoal("goal_456");

      const claim1: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const claim2: GoalClaim = {
        goalId: "goal_456",
        claimedBy: workerB,
        claimedAt: "2025-01-15T10:05:00.000Z",
        claimExpiresAt: "2025-01-15T10:35:00.000Z",
      };

      store.setClaim(claim1);
      store.setClaim(claim2);
      store.releaseClaim("goal_123");

      expect(store.getClaim("goal_123")).toBeNull();
      expect(store.getClaim("goal_456")).toEqual(claim2);
    });

    it("handles releasing non-existent claim gracefully", () => {
      insertGoal("goal_123");
      expect(() => store.releaseClaim("goal_123")).not.toThrow();
    });

    it("handles releasing claim on non-existent goal gracefully", () => {
      expect(() => store.releaseClaim("goal_nonexistent")).not.toThrow();
    });
  });

  describe("claim column nullification", () => {
    it("sets all claim columns to NULL on release", () => {
      insertGoal("goal_123");
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);
      store.releaseClaim("goal_123");

      const row = db
        .prepare("SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?")
        .get("goal_123") as { claimedBy: string | null; claimedAt: string | null; claimExpiresAt: string | null };

      expect(row.claimedBy).toBeNull();
      expect(row.claimedAt).toBeNull();
      expect(row.claimExpiresAt).toBeNull();
    });
  });
});
