import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import Database from "better-sqlite3";
import { DependencyStatus } from "../../../../../../src/domain/dependencies/Constants.js";
import { SqliteDependencyViewReader } from "../../../../../../src/infrastructure/context/dependencies/get/SqliteDependencyViewReader.js";

describe("SqliteDependencyViewReader.search", () => {
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

  function insertDependency(overrides: Partial<{
    id: string;
    consumerId: string;
    providerId: string;
    name: string | null;
    ecosystem: string | null;
    packageName: string | null;
    versionConstraint: string | null;
    endpoint: string | null;
    contract: string | null;
    status: string;
    createdAt: string;
  }> = {}): void {
    const defaults = {
      id: "dep_" + Math.random().toString(36).slice(2, 8),
      consumerId: "",
      providerId: "",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: null,
      contract: "HTTP server",
      status: DependencyStatus.ACTIVE,
      createdAt: "2025-01-01T00:00:00Z",
    };
    const d = { ...defaults, ...overrides };
    db.prepare(`
      INSERT INTO dependency_views (
        dependencyId, consumerId, providerId, name, ecosystem, packageName, versionConstraint,
        endpoint, contract, status, version, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      d.id,
      d.consumerId,
      d.providerId,
      d.name,
      d.ecosystem,
      d.packageName,
      d.versionConstraint,
      d.endpoint,
      d.contract,
      d.status,
      1,
      d.createdAt,
      d.createdAt
    );
  }

  it("should filter by identity fields using substring matching", async () => {
    insertDependency({ id: "dep_1", name: "Express", ecosystem: "npm", packageName: "express" });
    insertDependency({ id: "dep_2", name: "Requests", ecosystem: "pip", packageName: "requests" });

    const result = await reader.search({ ecosystem: "np", packageName: "press" });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_1");
  });

  it("should support star wildcards", async () => {
    insertDependency({ id: "dep_1", packageName: "@types/node" });
    insertDependency({ id: "dep_2", packageName: "@types/jest" });
    insertDependency({ id: "dep_3", packageName: "typescript" });

    const result = await reader.search({ packageName: "@types/*" });

    expect(result.map(d => d.dependencyId).sort()).toEqual(["dep_1", "dep_2"]);
  });

  it("should combine filters with AND logic", async () => {
    insertDependency({ id: "dep_1", ecosystem: "npm", packageName: "express", contract: "HTTP routing" });
    insertDependency({ id: "dep_2", ecosystem: "npm", packageName: "jest", contract: "Test runner" });
    insertDependency({ id: "dep_3", ecosystem: "pip", packageName: "requests", contract: "HTTP client" });

    const result = await reader.search({ ecosystem: "npm", query: "HTTP" });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_1");
  });

  it("should filter by exact status", async () => {
    insertDependency({ id: "dep_1", status: DependencyStatus.ACTIVE });
    insertDependency({ id: "dep_2", status: DependencyStatus.REMOVED });

    const result = await reader.search({ status: DependencyStatus.REMOVED });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_2");
  });

  it("should search contract and endpoint with free text", async () => {
    insertDependency({ id: "dep_1", endpoint: "https://api.stripe.com", contract: null });
    insertDependency({ id: "dep_2", endpoint: null, contract: "Message queue client" });

    const result = await reader.search({ query: "stripe" });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_1");
  });

  it("should search nullable legacy rows through mapped external identity fields", async () => {
    insertDependency({
      id: "dep_legacy",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      name: null,
      ecosystem: null,
      packageName: null,
      versionConstraint: null,
      contract: null,
      endpoint: null,
    });

    const byName = await reader.search({ name: "Database" });
    const byEcosystem = await reader.search({ ecosystem: "legacy" });
    const byQuery = await reader.search({ query: "DatabaseClient" });

    expect(byName.map(d => d.dependencyId)).toEqual(["dep_legacy"]);
    expect(byEcosystem.map(d => d.dependencyId)).toEqual(["dep_legacy"]);
    expect(byQuery.map(d => d.dependencyId)).toEqual(["dep_legacy"]);
  });

  it("should filter by legacy consumer and provider using search matching", async () => {
    insertDependency({ id: "dep_1", consumerId: "AuthService", providerId: "DatabaseClient" });
    insertDependency({ id: "dep_2", consumerId: "BillingService", providerId: "StripeClient" });

    const result = await reader.search({ consumer: "Auth*", provider: "*Client" });

    expect(result).toHaveLength(1);
    expect(result[0].dependencyId).toBe("dep_1");
  });
});
