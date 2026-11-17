import Database from "better-sqlite3";
import { SqliteArchitectureDeprecatedProjector } from "../../../../../../src/infrastructure/context/architecture/deprecate/SqliteArchitectureDeprecatedProjector.js";
import { ArchitectureDeprecatedEvent } from "../../../../../../src/domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";
import { ArchitectureEventType } from "../../../../../../src/domain/architecture/Constants.js";

describe("SqliteArchitectureDeprecatedProjector", () => {
  let db: Database.Database;
  let projector: SqliteArchitectureDeprecatedProjector;

  const architectureId = "architecture";

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE architecture_views (
        architectureId TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        organization TEXT NOT NULL,
        patterns TEXT NOT NULL,
        principles TEXT NOT NULL,
        dataStores TEXT NOT NULL,
        stack TEXT NOT NULL,
        deprecated INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    db.prepare(`
      INSERT INTO architecture_views (architectureId, description, organization, patterns, principles, dataStores, stack, deprecated, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      architectureId,
      "Event-sourced DDD system",
      "Clean Architecture",
      JSON.stringify(["DDD", "CQRS"]),
      JSON.stringify(["Single Responsibility"]),
      JSON.stringify([]),
      JSON.stringify(["TypeScript"]),
      0,
      1,
      "2025-01-01T00:00:00Z",
      "2025-01-01T00:00:00Z"
    );

    projector = new SqliteArchitectureDeprecatedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyArchitectureDeprecated", () => {
    it("should set deprecated to 1 in architecture_views", async () => {
      const event: ArchitectureDeprecatedEvent = {
        type: ArchitectureEventType.DEPRECATED,
        aggregateId: architectureId,
        version: 2,
        timestamp: "2025-06-01T00:00:00Z",
        payload: { reason: "Replaced by fine-grained entities" },
      };

      await projector.applyArchitectureDeprecated(event);

      const row = db.prepare("SELECT * FROM architecture_views WHERE architectureId = ?").get(architectureId) as Record<string, unknown>;
      expect(row.deprecated).toBe(1);
      expect(row.version).toBe(2);
      expect(row.updatedAt).toBe("2025-06-01T00:00:00Z");
    });

    it("should not modify other fields", async () => {
      const event: ArchitectureDeprecatedEvent = {
        type: ArchitectureEventType.DEPRECATED,
        aggregateId: architectureId,
        version: 2,
        timestamp: "2025-06-01T00:00:00Z",
        payload: { reason: "Replaced by fine-grained entities" },
      };

      await projector.applyArchitectureDeprecated(event);

      const row = db.prepare("SELECT * FROM architecture_views WHERE architectureId = ?").get(architectureId) as Record<string, unknown>;
      expect(row.description).toBe("Event-sourced DDD system");
      expect(row.organization).toBe("Clean Architecture");
      expect(row.patterns).toBe(JSON.stringify(["DDD", "CQRS"]));
      expect(row.createdAt).toBe("2025-01-01T00:00:00Z");
    });
  });
});
