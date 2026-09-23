import Database from "better-sqlite3";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { SqliteGetGoalViewReader } from "../../../../../src/infrastructure/context/goals/get/SqliteGetGoalViewReader";

describe("SqliteGetGoalViewReader", () => {
  let db: Database.Database;
  let reader: SqliteGetGoalViewReader;

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
        reviewIssues TEXT,
        claimedBy TEXT,
        claimedAt TEXT,
        claimExpiresAt TEXT,
        nextGoalId TEXT,
        prerequisiteGoals TEXT DEFAULT '[]',
        branch TEXT,
        worktree TEXT
      )
    `);
    reader = new SqliteGetGoalViewReader(db);
  });

  afterEach(() => db.close());

  it("returns the mapped goal view by id", async () => {
    db.prepare(`
      INSERT INTO goal_views (
        goalId, title, objective, successCriteria, scopeIn, scopeOut,
        status, version, createdAt, updatedAt, progress, prerequisiteGoals
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "goal_123",
      "Later work",
      "Keep visible",
      '["Postponed"]',
      '["src/**"]',
      "[]",
      GoalStatus.TODO,
      1,
      "2026-09-11T09:00:00.000Z",
      "2026-09-11T09:00:00.000Z",
      '["Implemented command"]',
      "[]"
    );

    await expect(reader.findById("goal_123")).resolves.toEqual(
      expect.objectContaining({
        goalId: "goal_123",
        title: "Later work",
        status: GoalStatus.TODO,
        successCriteria: ["Postponed"],
        scopeIn: ["src/**"],
        progress: ["Implemented command"],
      })
    );
  });

  it("returns null when the goal does not exist", async () => {
    await expect(reader.findById("missing")).resolves.toBeNull();
  });
});
