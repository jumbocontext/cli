import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import Database from "better-sqlite3";
import { SqliteComponentViewReader } from "../../../../../../src/infrastructure/context/components/get/SqliteComponentViewReader.js";
import { ComponentType, ComponentStatus } from "../../../../../../src/domain/components/Constants.js";

describe("SqliteComponentViewReader.search", () => {
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

  function insertComponent(overrides: Partial<{
    id: string;
    name: string;
    type: string;
    description: string;
    responsibility: string;
    path: string;
    status: string;
  }> = {}): void {
    const defaults = {
      id: "comp_" + Math.random().toString(36).slice(2, 8),
      name: "TestComponent",
      type: ComponentType.SERVICE,
      description: "A test component",
      responsibility: "Testing things",
      path: "src/test.ts",
      status: ComponentStatus.ACTIVE,
    };
    const c = { ...defaults, ...overrides };
    db.prepare(`
      INSERT INTO component_views (componentId, name, type, description, responsibility, path, status, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.type, c.description, c.responsibility, c.path, c.status, 1, "2025-01-01T00:00:00Z", "2025-01-01T00:00:00Z");
  }

  describe("single filter", () => {
    it("should filter by name substring (case-insensitive in SQLite default)", async () => {
      insertComponent({ id: "comp_1", name: "AuthService" });
      insertComponent({ id: "comp_2", name: "UserService" });
      insertComponent({ id: "comp_3", name: "AuthMiddleware" });

      const result = await reader.search({ name: "Auth" });

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(["AuthMiddleware", "AuthService"]);
    });

    it("should filter by exact type", async () => {
      insertComponent({ id: "comp_1", name: "ApiGateway", type: ComponentType.API });
      insertComponent({ id: "comp_2", name: "UserService", type: ComponentType.SERVICE });
      insertComponent({ id: "comp_3", name: "OrderApi", type: ComponentType.API });

      const result = await reader.search({ type: ComponentType.API });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.type === ComponentType.API)).toBe(true);
    });

    it("should filter by exact status", async () => {
      insertComponent({ id: "comp_1", name: "ActiveComp", status: ComponentStatus.ACTIVE });
      insertComponent({ id: "comp_2", name: "DeprecatedComp", status: ComponentStatus.DEPRECATED });

      const result = await reader.search({ status: ComponentStatus.DEPRECATED });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("DeprecatedComp");
    });

    it("should filter by query substring across description", async () => {
      insertComponent({ id: "comp_1", name: "EventBus", description: "Handles event routing" });
      insertComponent({ id: "comp_2", name: "Logger", description: "Logs application output" });

      const result = await reader.search({ query: "event" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("EventBus");
    });

    it("should filter by query substring across responsibility", async () => {
      insertComponent({ id: "comp_1", name: "AuthService", responsibility: "User authentication" });
      insertComponent({ id: "comp_2", name: "Logger", responsibility: "Logging output" });

      const result = await reader.search({ query: "authentication" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("AuthService");
    });
  });

  describe("default status exclusion", () => {
    it("should exclude deprecated components when status is not specified", async () => {
      insertComponent({ id: "comp_1", name: "ActiveComp", status: ComponentStatus.ACTIVE });
      insertComponent({ id: "comp_2", name: "DeprecatedComp", status: ComponentStatus.DEPRECATED });

      const result = await reader.search({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("ActiveComp");
    });
  });

  describe("wildcard patterns", () => {
    it("should support prefix matching with trailing *", async () => {
      insertComponent({ id: "comp_1", name: "AuthService" });
      insertComponent({ id: "comp_2", name: "AuthMiddleware" });
      insertComponent({ id: "comp_3", name: "MyAuthLib" });

      const result = await reader.search({ name: "Auth*" });

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(["AuthMiddleware", "AuthService"]);
    });

    it("should support suffix matching with leading *", async () => {
      insertComponent({ id: "comp_1", name: "AuthService" });
      insertComponent({ id: "comp_2", name: "UserService" });
      insertComponent({ id: "comp_3", name: "EventBus" });

      const result = await reader.search({ name: "*Service" });

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(["AuthService", "UserService"]);
    });

    it("should support wildcard in query field", async () => {
      insertComponent({ id: "comp_1", name: "EventBus", description: "Handles event routing" });
      insertComponent({ id: "comp_2", name: "Logger", description: "Handles log output" });

      const result = await reader.search({ query: "Handles event*" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("EventBus");
    });

    it("should fall back to substring matching when no * present", async () => {
      insertComponent({ id: "comp_1", name: "MyAuthService" });

      const result = await reader.search({ name: "Auth" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("MyAuthService");
    });
  });

  describe("combined filters", () => {
    it("should combine name and type with AND logic", async () => {
      insertComponent({ id: "comp_1", name: "AuthService", type: ComponentType.SERVICE });
      insertComponent({ id: "comp_2", name: "AuthApi", type: ComponentType.API });
      insertComponent({ id: "comp_3", name: "UserService", type: ComponentType.SERVICE });

      const result = await reader.search({ name: "Auth", type: ComponentType.SERVICE });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("AuthService");
    });

    it("should combine name, type, and query with AND logic", async () => {
      insertComponent({ id: "comp_1", name: "AuthService", type: ComponentType.SERVICE, description: "Handles login" });
      insertComponent({ id: "comp_2", name: "AuthService2", type: ComponentType.SERVICE, description: "Handles tokens" });

      const result = await reader.search({ name: "Auth", type: ComponentType.SERVICE, query: "login" });

      expect(result).toHaveLength(1);
      expect(result[0].componentId).toBe("comp_1");
    });
  });

  describe("no match", () => {
    it("should return empty array when no components match", async () => {
      insertComponent({ id: "comp_1", name: "AuthService" });

      const result = await reader.search({ name: "NonExistent" });

      expect(result).toEqual([]);
    });

    it("should return empty array when database is empty", async () => {
      const result = await reader.search({ name: "Anything" });

      expect(result).toEqual([]);
    });
  });

  describe("result ordering", () => {
    it("should return results ordered by name", async () => {
      insertComponent({ id: "comp_1", name: "Zebra" });
      insertComponent({ id: "comp_2", name: "Alpha" });
      insertComponent({ id: "comp_3", name: "Middle" });

      const result = await reader.search({});

      expect(result.map(c => c.name)).toEqual(["Alpha", "Middle", "Zebra"]);
    });
  });
});
