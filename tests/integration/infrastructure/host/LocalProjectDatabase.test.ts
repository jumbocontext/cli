import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import Database from "better-sqlite3";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { LocalProjectDatabase } from "../../../../src/infrastructure/host/LocalProjectDatabase.js";
import { MigrationRunner } from "../../../../src/infrastructure/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../../../../src/infrastructure/persistence/migrations.config.js";

const migrations = getNamespaceMigrations(path.resolve("src/infrastructure"));

describe("LocalProjectDatabase", () => {
  let directory: string;
  let database: LocalProjectDatabase;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-local-database-"));
    database = new LocalProjectDatabase(directory);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    database.dispose();
    await fs.remove(directory);
  });

  it("opens a fresh database in WAL mode, applies existing migrations, and checkpoints before closing", () => {
    const db = database.open();
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'workers'").get()).toBeDefined();
    expect(new MigrationRunner(db).verifyNamespaceMigrations(migrations)).toBe(true);
    const pragma = jest.spyOn(db, "pragma");
    const close = jest.spyOn(db, "close");
    database.dispose();
    database.dispose();
    expect(pragma).toHaveBeenCalledWith("wal_checkpoint(TRUNCATE)");
    expect(close).toHaveBeenCalledTimes(1);
    expect(db.open).toBe(false);
    expect(fs.existsSync(path.join(directory, "jumbo.db-wal"))).toBe(false);
    expect(() => database.open()).toThrow();
  });

  it("applies pending worker migrations to a stale real database without changing applied checksums", () => {
    const stale = new Database(path.join(directory, "jumbo.db"));
    new MigrationRunner(stale).runNamespaceMigrations(migrations.filter(migration => migration.namespace !== "workers"));
    const applied = stale.prepare("SELECT namespace, version, checksum FROM schema_migrations ORDER BY namespace, version").all();
    expect(stale.prepare("SELECT name FROM sqlite_master WHERE name = 'workers'").get()).toBeUndefined();
    stale.close();
    const db = database.open();
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'workers'").get()).toBeDefined();
    expect(db.prepare("SELECT namespace, version, checksum FROM schema_migrations WHERE namespace != 'workers' ORDER BY namespace, version").all()).toEqual(applied);
    expect(new MigrationRunner(db).verifyNamespaceMigrations(migrations)).toBe(true);
  });

  it("creates the repository-local directory only when opened", () => {
    const root = path.join(directory, "nested", ".jumbo");
    database = new LocalProjectDatabase(root);
    expect(fs.existsSync(root)).toBe(false);
    database.open();
    expect(fs.existsSync(path.join(root, "jumbo.db"))).toBe(true);
  });

  it("attempts close even if checkpointing fails", () => {
    const db = database.open();
    const failure = new Error("checkpoint failed");
    jest.spyOn(db, "pragma").mockImplementation(() => { throw failure; });
    const close = jest.spyOn(db, "close");
    expect(() => database.dispose()).toThrow(failure);
    expect(close).toHaveBeenCalledTimes(1);
    expect(db.open).toBe(false);
    database.dispose();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it.each(["WAL", "migration"])("closes a partially acquired real database when %s fails", phase => {
    const failure = new Error(`${phase} failed`);
    const close = jest.spyOn(Database.prototype, "close");
    if (phase === "WAL") {
      jest.spyOn(Database.prototype, "pragma").mockImplementation(() => { throw failure; });
    } else {
      jest.spyOn(MigrationRunner.prototype, "runNamespaceMigrations").mockImplementation(() => { throw failure; });
    }
    expect(() => database.open()).toThrow(failure);
    expect(close).toHaveBeenCalledTimes(1);
    database.dispose();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("preserves the original acquisition error even when close also fails", () => {
    const failure = new Error("migration failed");
    const realClose = Database.prototype.close;
    jest.spyOn(MigrationRunner.prototype, "runNamespaceMigrations").mockImplementation(() => { throw failure; });
    jest.spyOn(Database.prototype, "close").mockImplementation(function (this: Database.Database) {
      realClose.call(this);
      throw new Error("close failed");
    });
    expect(() => database.open()).toThrow(failure);
    expect(console.error).toHaveBeenCalled();
  });

  it("handles open failure without an acquired handle", async () => {
    await fs.mkdir(path.join(directory, "jumbo.db"));
    expect(() => database.open()).toThrow();
    expect(() => database.dispose()).not.toThrow();
  });
});
