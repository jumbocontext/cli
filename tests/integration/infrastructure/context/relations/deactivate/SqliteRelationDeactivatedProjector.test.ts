import Database from "better-sqlite3";
import { SqliteRelationDeactivatedProjector } from "../../../../../../src/infrastructure/context/relations/deactivate/SqliteRelationDeactivatedProjector";
import { IRelationDeactivatedProjector } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedProjector";
import { IRelationDeactivatedReader } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedReader";
import { RelationDeactivatedEvent } from "../../../../../../src/domain/relations/deactivate/RelationDeactivatedEvent";
import { RelationEventType } from "../../../../../../src/domain/relations/Constants";

describe("SqliteRelationDeactivatedProjector", () => {
  let db: Database.Database;
  let projector: SqliteRelationDeactivatedProjector;

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
      "active",
      1,
      "2026-03-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z"
    );

    projector = new SqliteRelationDeactivatedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  it("implements projector and reader interfaces", () => {
    const projectorInterface: IRelationDeactivatedProjector = projector;
    const readerInterface: IRelationDeactivatedReader = projector;
    expect(projectorInterface.applyRelationDeactivated).toBeDefined();
    expect(readerInterface.findById).toBeDefined();
  });

  it("updates relation status, version, and updatedAt to deactivated", async () => {
    const event: RelationDeactivatedEvent = {
      type: RelationEventType.DEACTIVATED,
      aggregateId: "relation_123",
      version: 2,
      timestamp: "2026-03-01T10:00:00.000Z",
      payload: {
        reason: "Decision reversed",
        deactivatedAt: "2026-03-01T10:00:00.000Z",
      },
    };

    await projector.applyRelationDeactivated(event);

    const row = db.prepare("SELECT status, version, updatedAt FROM relation_views WHERE relationId = ?").get("relation_123") as { status: string; version: number; updatedAt: string };
    expect(row.status).toBe("deactivated");
    expect(row.version).toBe(2);
    expect(row.updatedAt).toBe("2026-03-01T10:00:00.000Z");
  });
});
