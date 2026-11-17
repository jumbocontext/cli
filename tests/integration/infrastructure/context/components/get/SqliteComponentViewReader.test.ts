import Database from "better-sqlite3";
import { SqliteComponentViewReader } from "../../../../../../src/infrastructure/context/components/get/SqliteComponentViewReader";
import { ComponentType } from "../../../../../../src/domain/components/Constants";

describe("SqliteComponentViewReader", () => {
  let db: Database.Database;
  let reader: SqliteComponentViewReader;

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
    reader = new SqliteComponentViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertComponent(id: string, name: string): void {
    db.prepare(`
      INSERT INTO component_views (componentId, name, type, description, responsibility, path, status, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, ComponentType.SERVICE, "desc", "resp", "src/test.ts", "active", 1, "2025-01-01T00:00:00Z", "2025-01-01T00:00:00Z");
  }

  describe("findByIds", () => {
    it("should return empty array for empty input", async () => {
      const result = await reader.findByIds([]);
      expect(result).toEqual([]);
    });

    it("should return a single component by ID", async () => {
      insertComponent("comp_1", "AuthService");

      const result = await reader.findByIds(["comp_1"]);

      expect(result).toHaveLength(1);
      expect(result[0].componentId).toBe("comp_1");
      expect(result[0].name).toBe("AuthService");
    });

    it("should return multiple components by IDs ordered by name", async () => {
      insertComponent("comp_1", "Zebra");
      insertComponent("comp_2", "Alpha");
      insertComponent("comp_3", "Middle");

      const result = await reader.findByIds(["comp_1", "comp_2", "comp_3"]);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Alpha");
      expect(result[1].name).toBe("Middle");
      expect(result[2].name).toBe("Zebra");
    });

    it("should return empty array for non-existent IDs", async () => {
      insertComponent("comp_1", "Existing");

      const result = await reader.findByIds(["nonexistent_1", "nonexistent_2"]);

      expect(result).toEqual([]);
    });
  });
});
