import Database from "better-sqlite3";
import { SqliteDependencyAddedProjector } from "../../../../../../src/infrastructure/context/dependencies/add/SqliteDependencyAddedProjector";
import { DependencyAddedEvent } from "../../../../../../src/domain/dependencies/add/DependencyAddedEvent";

describe("SqliteDependencyAddedProjector", () => {
  let db: Database.Database;
  let projector: SqliteDependencyAddedProjector;

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
    projector = new SqliteDependencyAddedProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  it("should project new external dependency payload", async () => {
    const event: DependencyAddedEvent = {
      type: "DependencyAddedEvent",
      aggregateId: "dep_npm_express",
      version: 1,
      timestamp: "2025-01-01T00:00:00Z",
      payload: {
        name: "Express",
        ecosystem: "npm",
        packageName: "express",
        versionConstraint: "^4.18.0",
        endpoint: null,
        contract: null,
      },
    };

    await projector.applyDependencyAdded(event);
    const projected = await projector.findById("dep_npm_express");

    expect(projected).not.toBeNull();
    expect(projected).toMatchObject({
      dependencyId: "dep_npm_express",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
    });
  });

  it("should upcast and project legacy consumer/provider payload", async () => {
    const event: DependencyAddedEvent = {
      type: "DependencyAddedEvent",
      aggregateId: "dep_legacy",
      version: 1,
      timestamp: "2025-01-01T00:00:00Z",
      payload: {
        consumerId: "UserService",
        providerId: "DatabaseClient",
        endpoint: "/api/users",
        contract: "IUserRepository",
      },
    };

    await projector.applyDependencyAdded(event);
    const projected = await projector.findById("dep_legacy");

    expect(projected).not.toBeNull();
    expect(projected).toMatchObject({
      dependencyId: "dep_legacy",
      name: "DatabaseClient",
      ecosystem: "legacy-component",
      packageName: "DatabaseClient",
      versionConstraint: null,
      endpoint: "/api/users",
      contract: "IUserRepository",
    });
  });
});
