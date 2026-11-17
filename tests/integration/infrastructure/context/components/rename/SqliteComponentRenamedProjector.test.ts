import Database from "better-sqlite3";
import { SqliteComponentRenamedProjector } from "../../../../../../src/infrastructure/context/components/rename/SqliteComponentRenamedProjector";
import { ComponentRenamedEvent } from "../../../../../../src/domain/components/rename/ComponentRenamedEvent";
import { ComponentEventType, ComponentType } from "../../../../../../src/domain/components/Constants";

describe("SqliteComponentRenamedProjector", () => {
  let db: Database.Database;
  let projector: SqliteComponentRenamedProjector;

  const componentId = "comp_test123";

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
      INSERT INTO component_views (componentId, name, type, description, responsibility, path, status, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(componentId, "OldName", ComponentType.SERVICE, "desc", "resp", "src/test.ts", "active", 1, "2025-01-01T00:00:00Z", "2025-01-01T00:00:00Z");

    projector = new SqliteComponentRenamedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  describe("applyComponentRenamed", () => {
    it("should update the name field in component_views", async () => {
      const event: ComponentRenamedEvent = {
        type: ComponentEventType.RENAMED,
        aggregateId: componentId,
        version: 2,
        timestamp: "2025-11-09T11:00:00Z",
        payload: { name: "NewName" },
      };

      await projector.applyComponentRenamed(event);

      const row = db.prepare("SELECT * FROM component_views WHERE componentId = ?").get(componentId) as Record<string, unknown>;
      expect(row.name).toBe("NewName");
      expect(row.version).toBe(2);
      expect(row.updatedAt).toBe("2025-11-09T11:00:00Z");
    });

    it("should not modify other fields", async () => {
      const event: ComponentRenamedEvent = {
        type: ComponentEventType.RENAMED,
        aggregateId: componentId,
        version: 2,
        timestamp: "2025-11-09T11:00:00Z",
        payload: { name: "NewName" },
      };

      await projector.applyComponentRenamed(event);

      const row = db.prepare("SELECT * FROM component_views WHERE componentId = ?").get(componentId) as Record<string, unknown>;
      expect(row.description).toBe("desc");
      expect(row.responsibility).toBe("resp");
      expect(row.path).toBe("src/test.ts");
      expect(row.type).toBe("service");
      expect(row.status).toBe("active");
      expect(row.createdAt).toBe("2025-01-01T00:00:00Z");
    });
  });

  describe("findById", () => {
    it("should return component view by ID", async () => {
      const view = await projector.findById(componentId);

      expect(view).not.toBeNull();
      expect(view!.componentId).toBe(componentId);
      expect(view!.name).toBe("OldName");
      expect(view!.type).toBe("service");
    });

    it("should return null for non-existent component", async () => {
      const view = await projector.findById("nonexistent");

      expect(view).toBeNull();
    });
  });
});
