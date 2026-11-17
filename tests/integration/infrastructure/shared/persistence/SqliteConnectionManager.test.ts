import fs from "fs-extra";
import * as path from "path";
import { SqliteConnectionManager } from "../../../../../src/infrastructure/persistence/SqliteConnectionManager";
import os from "os";

describe("SqliteConnectionManager", () => {
  let tmpDir: string;
  let dbPath: string;
  let manager: SqliteConnectionManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-jumbo-"));
    dbPath = path.join(tmpDir, "test.db");
  });

  afterEach(async () => {
    if (manager) {
      await manager.dispose();
    }
    await fs.remove(tmpDir);
  });

  it("creates database connection on construction (RAII)", () => {
    manager = new SqliteConnectionManager(dbPath);
    const db = manager.getConnection();

    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it("creates database file at specified path", () => {
    manager = new SqliteConnectionManager(dbPath);

    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it("enables WAL mode", () => {
    manager = new SqliteConnectionManager(dbPath);
    const db = manager.getConnection();

    const result = db.pragma("journal_mode", { simple: true });
    expect(result).toBe("wal");
  });

  it("returns same connection instance on multiple calls", () => {
    manager = new SqliteConnectionManager(dbPath);

    const db1 = manager.getConnection();
    const db2 = manager.getConnection();

    expect(db1).toBe(db2);
  });

  it("dispose() closes database connection", async () => {
    manager = new SqliteConnectionManager(dbPath);
    const db = manager.getConnection();
    expect(db.open).toBe(true);

    await manager.dispose();

    expect(db.open).toBe(false);
  });

  it("dispose() is idempotent (safe to call multiple times)", async () => {
    manager = new SqliteConnectionManager(dbPath);

    await manager.dispose();
    await expect(manager.dispose()).resolves.not.toThrow();
  });

  it("can execute queries", () => {
    manager = new SqliteConnectionManager(dbPath);
    const db = manager.getConnection();

    const result = db.prepare("SELECT 1 as test").get();
    expect(result).toEqual({ test: 1 });
  });

  it("can create and query tables", () => {
    manager = new SqliteConnectionManager(dbPath);
    const db = manager.getConnection();

    db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
    db.prepare("INSERT INTO test (name) VALUES (?)").run("test-value");

    const result = db.prepare("SELECT name FROM test WHERE id = 1").get() as { name: string };
    expect(result.name).toBe("test-value");
  });
});
