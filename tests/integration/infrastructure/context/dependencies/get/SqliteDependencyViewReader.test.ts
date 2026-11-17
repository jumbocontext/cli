import Database from "better-sqlite3";
import { SqliteDependencyViewReader } from "../../../../../../src/infrastructure/context/dependencies/get/SqliteDependencyViewReader";

describe("SqliteDependencyViewReader", () => {
  let db: Database.Database;
  let reader: SqliteDependencyViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE dependency_views (
        dependencyId TEXT PRIMARY KEY,
        consumerId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        name TEXT,
        ecosystem TEXT,
        packageName TEXT,
        versionConstraint TEXT,
        endpoint TEXT,
        contract TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        removedAt TEXT,
        removalReason TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    reader = new SqliteDependencyViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  it("should map modern external dependency rows to DependencyView", async () => {
    db.prepare(`
      INSERT INTO dependency_views (
        dependencyId, consumerId, providerId, name, ecosystem, packageName, versionConstraint,
        status, version, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "dep_1",
      "",
      "",
      "Express",
      "npm",
      "express",
      "^4.18.0",
      "active",
      1,
      "2025-01-01T00:00:00Z",
      "2025-01-01T00:00:00Z"
    );

    const result = await reader.findByIds(["dep_1"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      dependencyId: "dep_1",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
    });
  });

  it("should upcast legacy consumer/provider rows to external semantics", async () => {
    db.prepare(`
      INSERT INTO dependency_views (
        dependencyId, consumerId, providerId, status, version, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "dep_legacy",
      "UserService",
      "DatabaseClient",
      "active",
      1,
      "2025-01-01T00:00:00Z",
      "2025-01-01T00:00:00Z"
    );

    const result = await reader.findByIds(["dep_legacy"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      dependencyId: "dep_legacy",
      name: "DatabaseClient",
      ecosystem: "legacy-component",
      packageName: "DatabaseClient",
      versionConstraint: null,
    });
  });

  it("should filter by new external dependency fields", async () => {
    db.prepare(`
      INSERT INTO dependency_views (
        dependencyId, consumerId, providerId, name, ecosystem, packageName, status, version, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("dep_1", "", "", "Express", "npm", "express", "active", 1, "2025-01-01T00:00:00Z", "2025-01-01T00:00:00Z");
    db.prepare(`
      INSERT INTO dependency_views (
        dependencyId, consumerId, providerId, name, ecosystem, packageName, status, version, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("dep_2", "", "", "Requests", "pip", "requests", "active", 1, "2025-01-02T00:00:00Z", "2025-01-02T00:00:00Z");

    const result = await reader.findAll({ ecosystem: "npm" });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_1");
  });
});
