import Database from "better-sqlite3";
import { SqliteComponentUndeprecatedProjector } from "../../../../../../src/infrastructure/context/components/undeprecate/SqliteComponentUndeprecatedProjector.js";
import { ComponentUndeprecatedEvent } from "../../../../../../src/domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { ComponentEventType } from "../../../../../../src/domain/components/Constants.js";

describe("SqliteComponentUndeprecatedProjector", () => {
  let db: Database.Database;
  let projector: SqliteComponentUndeprecatedProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE component_views (
        componentId TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        responsibility TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL,
        deprecationReason TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    db.prepare(`
      INSERT INTO component_views (
        componentId, name, type, description, responsibility, path,
        status, deprecationReason, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "comp_123",
      "LegacyService",
      "service",
      "desc",
      "resp",
      "src/legacy.ts",
      "deprecated",
      "Deprecated",
      2,
      "2026-03-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z"
    );

    projector = new SqliteComponentUndeprecatedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  it("sets status to active and clears deprecation reason", async () => {
    const event: ComponentUndeprecatedEvent = {
      type: ComponentEventType.UNDEPRECATED,
      aggregateId: "comp_123",
      version: 3,
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: {
        reason: "Still needed",
        undeprecatedAt: "2026-03-02T00:00:00.000Z",
      },
    };

    await projector.applyComponentUndeprecated(event);

    const row = db.prepare("SELECT status, deprecationReason, version FROM component_views WHERE componentId = ?").get("comp_123") as { status: string; deprecationReason: string | null; version: number };
    expect(row.status).toBe("active");
    expect(row.deprecationReason).toBeNull();
    expect(row.version).toBe(3);
  });
});
