import Database from "better-sqlite3";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { MigrationRunner } from "../../../../src/infrastructure/persistence/MigrationRunner";
import { jest } from "@jest/globals";

describe("MigrationRunner", () => {
  let tempDir: string;
  let db: Database.Database;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-migrations-"));
    db = new Database(path.join(tempDir, "test.db"));
  });

  afterEach(async () => {
    if (db.open) {
      db.close();
    }

    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  async function writeMigration(
    namespace: string,
    filename: string,
    sql: string
  ): Promise<string> {
    const namespaceDir = path.join(tempDir, namespace);
    await fs.ensureDir(namespaceDir);
    await fs.writeFile(path.join(namespaceDir, filename), sql, "utf8");
    return namespaceDir;
  }

  it("applies all migrations for a new database", async () => {
    const alphaDir = await writeMigration(
      "alpha",
      "001-create_alpha.sql",
      "CREATE TABLE alpha_items (id TEXT PRIMARY KEY);"
    );
    const betaDir = await writeMigration(
      "beta",
      "001-create_beta.sql",
      "CREATE TABLE beta_items (id TEXT PRIMARY KEY);"
    );

    const runner = new MigrationRunner(db);
    runner.runNamespaceMigrations([
      { namespace: "alpha", path: alphaDir },
      { namespace: "beta", path: betaDir },
    ]);

    const alphaTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'alpha_items'")
      .get();
    const betaTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beta_items'")
      .get();
    const migrationCount = (
      db.prepare("SELECT COUNT(*) as count FROM schema_migrations").get() as { count: number }
    ).count;

    expect(alphaTable).toBeDefined();
    expect(betaTable).toBeDefined();
    expect(migrationCount).toBe(2);
  });

  it("applies only pending migrations for an existing database", async () => {
    const alphaDir = await writeMigration(
      "alpha",
      "001-create_alpha.sql",
      "CREATE TABLE alpha_items (id TEXT PRIMARY KEY);"
    );
    const betaDir = await writeMigration(
      "beta",
      "001-create_beta.sql",
      "CREATE TABLE beta_items (id TEXT PRIMARY KEY);"
    );

    const runner = new MigrationRunner(db);
    runner.runNamespaceMigrations([{ namespace: "alpha", path: alphaDir }]);

    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beta_items'").get()
    ).toBeUndefined();

    runner.runNamespaceMigrations([
      { namespace: "alpha", path: alphaDir },
      { namespace: "beta", path: betaDir },
    ]);

    const migrationRows = db
      .prepare("SELECT namespace, version FROM schema_migrations ORDER BY namespace, version")
      .all() as Array<{ namespace: string; version: number }>;

    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'alpha_items'").get()
    ).toBeDefined();
    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beta_items'").get()
    ).toBeDefined();
    expect(migrationRows).toEqual([
      { namespace: "alpha", version: 1 },
      { namespace: "beta", version: 1 },
    ]);
  });

  it("executes no migration SQL when the database is fully migrated", async () => {
    const alphaDir = await writeMigration(
      "alpha",
      "001-create_alpha.sql",
      "CREATE TABLE alpha_items (id TEXT PRIMARY KEY);"
    );
    const betaDir = await writeMigration(
      "beta",
      "001-create_beta.sql",
      "CREATE TABLE beta_items (id TEXT PRIMARY KEY);"
    );

    const runner = new MigrationRunner(db);
    runner.runNamespaceMigrations([
      { namespace: "alpha", path: alphaDir },
      { namespace: "beta", path: betaDir },
    ]);

    const execSpy = jest.spyOn(db, "exec");
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    runner.runNamespaceMigrations([
      { namespace: "alpha", path: alphaDir },
      { namespace: "beta", path: betaDir },
    ]);

    expect(execSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
