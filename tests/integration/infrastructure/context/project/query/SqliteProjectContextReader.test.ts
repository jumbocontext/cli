import Database from "better-sqlite3";
import { SqliteProjectContextReader } from "../../../../../../src/infrastructure/context/project/query/SqliteProjectContextReader.js";
import { ComponentStatus } from "../../../../../../src/domain/components/Constants.js";
import { DecisionStatus } from "../../../../../../src/domain/decisions/Constants.js";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants.js";

describe("SqliteProjectContextReader", () => {
  let db: Database.Database;
  let reader: SqliteProjectContextReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE project_views (
        projectId TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        purpose TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE architecture_views (
        architectureId TEXT PRIMARY KEY
      );

      CREATE TABLE component_views (
        componentId TEXT PRIMARY KEY,
        status TEXT NOT NULL
      );

      CREATE TABLE decision_views (
        decisionId TEXT PRIMARY KEY,
        status TEXT NOT NULL
      );

      CREATE TABLE invariant_views (
        invariantId TEXT PRIMARY KEY
      );

      CREATE TABLE guideline_views (
        guidelineId TEXT PRIMARY KEY,
        isRemoved INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE goal_views (
        goalId TEXT PRIMARY KEY,
        status TEXT NOT NULL
      );
    `);
    reader = new SqliteProjectContextReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertProject(): void {
    db.prepare(`
      INSERT INTO project_views (projectId, name, purpose, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "project_1",
      "Jumbo",
      "Agent orchestration",
      1,
      "2025-01-01T00:00:00Z",
      "2025-01-01T00:00:00Z"
    );
  }

  it("derives uninitialized state when no project view exists", async () => {
    await expect(reader.getProject()).resolves.toBeNull();
    await expect(reader.getProjectLifecycleState()).resolves.toBe("uninitialized");
  });

  it("derives unprimed state for an initialized project without project knowledge", async () => {
    insertProject();

    await expect(reader.getProjectLifecycleState()).resolves.toBe("unprimed");
  });

  it("derives primed-empty state when solution context exists without any goals", async () => {
    insertProject();
    db.prepare("INSERT INTO component_views (componentId, status) VALUES (?, ?)")
      .run("component_1", ComponentStatus.ACTIVE);

    await expect(reader.getProjectLifecycleState()).resolves.toBe("primed-empty");
  });

  it("derives primed state when solution context and any goal exist", async () => {
    insertProject();
    db.prepare("INSERT INTO decision_views (decisionId, status) VALUES (?, ?)")
      .run("decision_1", DecisionStatus.ACTIVE);
    db.prepare("INSERT INTO goal_views (goalId, status) VALUES (?, ?)")
      .run("goal_1", GoalStatus.DONE);

    await expect(reader.getProjectLifecycleState()).resolves.toBe("primed");
  });

  it("exposes lifecycle state on the project view", async () => {
    insertProject();
    db.prepare("INSERT INTO invariant_views (invariantId) VALUES (?)").run("invariant_1");
    db.prepare("INSERT INTO goal_views (goalId, status) VALUES (?, ?)")
      .run("goal_1", GoalStatus.REFINED);

    const project = await reader.getProject();

    expect(project).toMatchObject({
      projectId: "project_1",
      name: "Jumbo",
      purpose: "Agent orchestration",
      lifecycleState: "primed",
    });
  });
});
