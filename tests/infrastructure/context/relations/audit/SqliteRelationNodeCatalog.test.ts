import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { SqliteRelationNodeCatalog } from "../../../../../src/infrastructure/context/relations/audit/SqliteRelationNodeCatalog.js";
import { EntityType } from "../../../../../src/domain/relations/Constants.js";

describe("SqliteRelationNodeCatalog", () => {
  let db: Database.Database;
  let catalog: SqliteRelationNodeCatalog;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE session_views (sessionId TEXT, status TEXT);
      CREATE TABLE goal_views (goalId TEXT, status TEXT);
      CREATE TABLE decision_views (decisionId TEXT, status TEXT);
      CREATE TABLE architecture_views (architectureId TEXT, deprecated INTEGER);
      CREATE TABLE component_views (componentId TEXT, status TEXT);
      CREATE TABLE dependency_views (dependencyId TEXT, status TEXT);
      CREATE TABLE guideline_views (guidelineId TEXT, isRemoved INTEGER);
      CREATE TABLE project_views (projectId TEXT);
      CREATE TABLE audience_views (audienceId TEXT, isRemoved INTEGER);
      CREATE TABLE invariant_views (invariantId TEXT);
      CREATE TABLE audience_pain_views (painId TEXT, status TEXT);
      CREATE TABLE value_proposition_views (valuePropositionId TEXT);
      CREATE TABLE relation_views (relationId TEXT, status TEXT);

      INSERT INTO session_views VALUES ('session-1', 'ended');
      INSERT INTO goal_views VALUES ('goal-1', 'done');
      INSERT INTO decision_views VALUES ('decision-1', 'reversed'), ('decision-removed', 'removed');
      INSERT INTO architecture_views VALUES ('architecture-1', 1);
      INSERT INTO component_views VALUES ('component-1', 'deprecated'), ('component-removed', 'removed');
      INSERT INTO dependency_views VALUES ('dependency-1', 'deprecated'), ('dependency-removed', 'removed');
      INSERT INTO guideline_views VALUES ('guideline-1', 0), ('guideline-removed', 1);
      INSERT INTO project_views VALUES ('project-1');
      INSERT INTO audience_views VALUES ('audience-1', 0), ('audience-removed', 1);
      INSERT INTO invariant_views VALUES ('invariant-1');
      INSERT INTO audience_pain_views VALUES ('pain-1', 'resolved');
      INSERT INTO value_proposition_views VALUES ('value-1');
      INSERT INTO relation_views VALUES ('relation-1', 'deactivated'), ('relation-removed', 'removed');
    `);
    catalog = new SqliteRelationNodeCatalog(db);
  });

  afterEach(() => db.close());

  it("has compile-time and runtime coverage for every relation endpoint EntityType", () => {
    expect(catalog.getSupportedEntityTypes()).toEqual([...Object.values(EntityType)].sort());
  });

  it("reads only typed identities and maps each projection lifecycle consistently", async () => {
    const entries = await catalog.findAll();

    expect(entries).toEqual(expect.arrayContaining([
      { entityType: "session", entityId: "session-1", lifecycleState: "ended", isCurrent: true },
      { entityType: "goal", entityId: "goal-1", lifecycleState: "done", isCurrent: true },
      { entityType: "decision", entityId: "decision-1", lifecycleState: "reversed", isCurrent: true },
      { entityType: "architecture", entityId: "architecture-1", lifecycleState: "deprecated", isCurrent: true },
      { entityType: "component", entityId: "component-1", lifecycleState: "deprecated", isCurrent: true },
      { entityType: "dependency", entityId: "dependency-1", lifecycleState: "deprecated", isCurrent: true },
      { entityType: "guideline", entityId: "guideline-1", lifecycleState: "active", isCurrent: true },
      { entityType: "project", entityId: "project-1", lifecycleState: "active", isCurrent: true },
      { entityType: "audience", entityId: "audience-1", lifecycleState: "active", isCurrent: true },
      { entityType: "invariant", entityId: "invariant-1", lifecycleState: "active", isCurrent: true },
      { entityType: "pain", entityId: "pain-1", lifecycleState: "resolved", isCurrent: true },
      { entityType: "value", entityId: "value-1", lifecycleState: "active", isCurrent: true },
      { entityType: "relation", entityId: "relation-1", lifecycleState: "deactivated", isCurrent: true },
    ]));
    expect(entries.filter((entry) => !entry.isCurrent).map((entry) => `${entry.entityType}:${entry.entityId}`))
      .toEqual([
        "audience:audience-removed",
        "component:component-removed",
        "decision:decision-removed",
        "dependency:dependency-removed",
        "guideline:guideline-removed",
        "relation:relation-removed",
      ]);
    expect(entries).toEqual([...entries].sort((left, right) =>
      left.entityType.localeCompare(right.entityType) || left.entityId.localeCompare(right.entityId),
    ));
  });
});
