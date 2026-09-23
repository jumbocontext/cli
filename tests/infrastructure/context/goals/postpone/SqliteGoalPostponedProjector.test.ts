import Database from "better-sqlite3";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalPostponedEvent } from "../../../../../src/domain/goals/postpone/GoalPostponedEvent";
import { SqliteGoalPostponedProjector } from "../../../../../src/infrastructure/context/goals/postpone/SqliteGoalPostponedProjector";

describe("SqliteGoalPostponedProjector", () => {
  let db: Database.Database;
  let projector: SqliteGoalPostponedProjector;

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
      GoalStatus.TODO,
      1,
      "2026-09-11T09:00:00.000Z",
      "2026-09-11T09:00:00.000Z"
    );
    projector = new SqliteGoalPostponedProjector(db);
  });

  afterEach(() => db.close());

  it("updates status, version, and updatedAt", async () => {
    const event: GoalPostponedEvent = {
      type: GoalEventType.POSTPONED,
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-09-11T10:00:00.000Z",
      payload: { status: GoalStatus.POSTPONED },
    };

    await projector.applyGoalPostponed(event);

    expect(db.prepare("SELECT status, version, updatedAt FROM goal_views WHERE goalId = ?").get("goal_123"))
      .toEqual({ status: GoalStatus.POSTPONED, version: 2, updatedAt: event.timestamp });
  });
});
