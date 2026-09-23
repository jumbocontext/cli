import Database from "better-sqlite3";
import fs from "fs-extra";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { ProjectionBusFactory } from "../../../src/infrastructure/messaging/ProjectionBusFactory";
import { MigrationRunner } from "../../../src/infrastructure/persistence/MigrationRunner";
import { getNamespaceMigrations } from "../../../src/infrastructure/persistence/migrations.config";
import { SearchCategory } from "../../../src/application/context/search/SearchCategory";
import { ComponentEventType, ComponentStatus } from "../../../src/domain/components/Constants";
import { DecisionEventType, DecisionStatus } from "../../../src/domain/decisions/Constants";
import { GuidelineEventType } from "../../../src/domain/guidelines/Constants";
import { InvariantEventType } from "../../../src/domain/invariants/Constants";
import { EntityType, RelationEventType, RelationStatus } from "../../../src/domain/relations/Constants";
import os from "os";
import { BaseEvent } from "../../../src/domain/BaseEvent";
import { GoalEventType, GoalStatus } from "../../../src/domain/goals/Constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("ProjectionBusFactory", () => {
  let tmpDir: string;
  let db: Database.Database;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-projection-bus-"));
    const dbPath = path.join(tmpDir, "jumbo.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    const infrastructureDir = path.resolve(__dirname, "../../../src/infrastructure");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(db);
    migrationRunner.runNamespaceMigrations(migrations);
  });

  afterEach(async () => {
    if (db && db.open) db.close();
    await fs.remove(tmpDir);
  });

  it("creates an event bus that projects ComponentDeprecatedEvent without triggering cascades", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    // First add the component so deprecation has something to update
    await bus.publish({
      type: ComponentEventType.ADDED,
      aggregateId: "comp-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        name: "TestComponent",
        type: "service",
        description: "A test component",
        responsibility: "",
        path: "",
        status: ComponentStatus.ACTIVE,
      },
    } as BaseEvent);

    // Deprecate it — should project without cascade errors
    await bus.publish({
      type: ComponentEventType.DEPRECATED,
      aggregateId: "comp-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        status: ComponentStatus.DEPRECATED,
        reason: "No longer needed",
        deprecatedAt: "2026-01-01T01:00:00.000Z",
      },
    } as BaseEvent);

    const rows = db.prepare("SELECT * FROM component_views").all();
    expect(rows).toHaveLength(1);
    const row = rows[0] as { status: string };
    expect(row.status).toBe(ComponentStatus.DEPRECATED);
  });

  it("rebuilds reinstated goal state from its complete event history", async () => {
    const bus = new ProjectionBusFactory().create(db);

    await bus.publish({
      type: GoalEventType.ADDED,
      aggregateId: "goal-postponed",
      version: 1,
      timestamp: "2026-09-11T09:00:00.000Z",
      payload: {
        title: "Later work",
        objective: "Keep this goal visible",
        successCriteria: ["It remains listed"],
        scopeIn: [],
        scopeOut: [],
        status: GoalStatus.TODO,
      },
    } as BaseEvent);
    await bus.publish({
      type: GoalEventType.POSTPONED,
      aggregateId: "goal-postponed",
      version: 2,
      timestamp: "2026-09-11T10:00:00.000Z",
      payload: { status: GoalStatus.POSTPONED },
    } as BaseEvent);
    await bus.publish({
      type: GoalEventType.REINSTATED,
      aggregateId: "goal-postponed",
      version: 3,
      timestamp: "2026-09-11T11:00:00.000Z",
      payload: { status: GoalStatus.TODO },
    } as BaseEvent);

    expect(db.prepare("SELECT status, version FROM goal_views WHERE goalId = ?").get("goal-postponed"))
      .toEqual({ status: GoalStatus.TODO, version: 3 });
  });

  it("creates an event bus that rebuilds the global search index from memory events", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    await bus.publish({
      type: ComponentEventType.ADDED,
      aggregateId: "comp-search",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        name: "SearchIndex",
        type: "service",
        description: "Projects searchable memory",
        responsibility: "Index events",
        path: "src/search",
        status: ComponentStatus.ACTIVE,
      },
    } as BaseEvent);

    await bus.publish({
      type: GuidelineEventType.ADDED,
      aggregateId: "guide-search",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        category: "testing",
        title: "Search index tests",
        description: "Cover projected query behavior",
        rationale: "Rebuild must be deterministic",
        examples: ["ProjectionBusFactory replay"],
      },
    } as BaseEvent);

    await bus.publish({
      type: InvariantEventType.ADDED,
      aggregateId: "inv-search",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        title: "No junk drawers",
        description: "Keep source files organized by domain concept",
        rationale: "Search rebuild must include invariant memory",
      },
    } as BaseEvent);

    const rows = db
      .prepare("SELECT sourceType, sourceId, category, title FROM search_index_entries ORDER BY category")
      .all() as Array<{ sourceType: string; sourceId: string; category: string; title: string }>;

    expect(rows).toEqual([
      {
        sourceType: SearchCategory.COMPONENT,
        sourceId: "comp-search",
        category: SearchCategory.COMPONENT,
        title: "SearchIndex",
      },
      {
        sourceType: SearchCategory.GUIDELINE,
        sourceId: "guide-search",
        category: SearchCategory.GUIDELINE,
        title: "Search index tests",
      },
      {
        sourceType: SearchCategory.INVARIANT,
        sourceId: "inv-search",
        category: SearchCategory.INVARIANT,
        title: "No junk drawers",
      },
    ]);
  });

  it("creates an event bus that projects RelationDeactivatedEvent directly", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    // Add a relation
    await bus.publish({
      type: RelationEventType.ADDED,
      aggregateId: "rel-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal-1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp-1",
        relationType: "involves",
        strength: null,
        description: "Test relation",
      },
    } as BaseEvent);

    // Deactivate it directly (as persisted by original cascade)
    await bus.publish({
      type: RelationEventType.DEACTIVATED,
      aggregateId: "rel-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        reason: "Component deprecated",
        deactivatedAt: "2026-01-01T01:00:00.000Z",
      },
    } as BaseEvent);

    const row = db.prepare("SELECT status FROM relation_views WHERE relationId = ?").get("rel-1") as { status: string };
    expect(row.status).toBe(RelationStatus.DEACTIVATED);
  });

  it("creates an event bus that projects DecisionSupersededEvent without triggering cascades", async () => {
    const factory = new ProjectionBusFactory();
    const bus = factory.create(db);

    await bus.publish({
      type: DecisionEventType.ADDED,
      aggregateId: "dec-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {
        title: "Test Decision",
        context: "Context",
        rationale: "Rationale",
        alternatives: [],
        consequences: null,
      },
    } as BaseEvent);

    await bus.publish({
      type: DecisionEventType.SUPERSEDED,
      aggregateId: "dec-1",
      version: 2,
      timestamp: "2026-01-01T01:00:00.000Z",
      payload: {
        supersededBy: "dec-2",
        supersededAt: "2026-01-01T01:00:00.000Z",
      },
    } as BaseEvent);

    const row = db.prepare("SELECT status FROM decision_views WHERE decisionId = ?").get("dec-1") as { status: string };
    expect(row.status).toBe(DecisionStatus.SUPERSEDED);
  });
});
