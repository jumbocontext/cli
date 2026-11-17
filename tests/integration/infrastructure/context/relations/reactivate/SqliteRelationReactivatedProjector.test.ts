import Database from "better-sqlite3";
import { SqliteRelationReactivatedProjector } from "../../../../../../src/infrastructure/context/relations/reactivate/SqliteRelationReactivatedProjector";
import { IRelationReactivatedProjector } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedProjector";
import { IRelationReactivatedReader } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedReader";
import { RelationReactivatedEvent } from "../../../../../../src/domain/relations/reactivate/RelationReactivatedEvent";
import { RelationEventType } from "../../../../../../src/domain/relations/Constants";

describe("SqliteRelationReactivatedProjector", () => {
  let db: Database.Database;
  let projector: SqliteRelationReactivatedProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE relation_views (
        relationId TEXT PRIMARY KEY,
        fromEntityType TEXT NOT NULL,
        fromEntityId TEXT NOT NULL,
        toEntityType TEXT NOT NULL,
        toEntityId TEXT NOT NULL,
        relationType TEXT NOT NULL,
        strength TEXT,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    db.prepare(`
      INSERT INTO relation_views (
        relationId, fromEntityType, fromEntityId, toEntityType, toEntityId,
        relationType, strength, description, status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "relation_123",
      "goal",
      "goal-1",
      "component",
      "component-1",
      "involves",
      null,
      "Goal requires component",
      "deactivated",
      2,
      "2026-03-01T00:00:00.000Z",
      "2026-03-01T10:00:00.000Z"
    );

    projector = new SqliteRelationReactivatedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  it("implements projector and reader interfaces", () => {
    const projectorInterface: IRelationReactivatedProjector = projector;
    const readerInterface: IRelationReactivatedReader = projector;
    expect(projectorInterface.applyRelationReactivated).toBeDefined();
    expect(readerInterface.findById).toBeDefined();
  });

  it("updates relation status, version, and updatedAt back to active", async () => {
    const event: RelationReactivatedEvent = {
      type: RelationEventType.REACTIVATED,
      aggregateId: "relation_123",
      version: 3,
      timestamp: "2026-03-01T11:00:00.000Z",
      payload: {
        reason: "Decision restored",
        reactivatedAt: "2026-03-01T11:00:00.000Z",
      },
    };

    await projector.applyRelationReactivated(event);

    const row = db.prepare("SELECT status, version, updatedAt FROM relation_views WHERE relationId = ?").get("relation_123") as { status: string; version: number; updatedAt: string };
    expect(row.status).toBe("active");
    expect(row.version).toBe(3);
    expect(row.updatedAt).toBe("2026-03-01T11:00:00.000Z");
  });
});
