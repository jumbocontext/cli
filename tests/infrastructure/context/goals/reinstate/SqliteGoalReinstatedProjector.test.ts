import Database from "better-sqlite3";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalReinstatedEvent } from "../../../../../src/domain/goals/reinstate/GoalReinstatedEvent";
import { SqliteGoalReinstatedProjector } from "../../../../../src/infrastructure/context/goals/reinstate/SqliteGoalReinstatedProjector";

describe("SqliteGoalReinstatedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalReinstatedProjector;

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
    db.prepare(`
      INSERT INTO goal_views (goalId, title, objective, status, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "goal_123",
      "Later work",
      "Keep visible",
      GoalStatus.POSTPONED,
      2,
      "2026-09-11T09:00:00.000Z",
      "2026-09-11T10:00:00.000Z"
    );
    projector = new SqliteGoalReinstatedProjector(db);
  });

  afterEach(() => db.close());

  it("updates status, version, and updatedAt", async () => {
    const event: GoalReinstatedEvent = {
      type: GoalEventType.REINSTATED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: "2026-09-11T11:00:00.000Z",
      payload: { status: GoalStatus.TODO },
    };

    await projector.applyGoalReinstated(event);

    expect(db.prepare("SELECT status, version, updatedAt FROM goal_views WHERE goalId = ?").get("goal_123"))
      .toEqual({ status: GoalStatus.TODO, version: 3, updatedAt: event.timestamp });
  });
});
