import Database from "better-sqlite3";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";
import { CachedContextProject } from "./ContextProject.js";
import { isProjectInitialized } from "./ProjectInitializationProbe.js";
import { ProjectNotInitializedError } from "../../application/host/ProjectNotInitializedError.js";

/** Opens the project's SQLite database, applies schema migrations, and closes the connection. */
export class LocalProjectDatabase {
  private db: Database.Database | undefined;
  private disposed = false;
  private proxy: Database.Database | undefined;

  constructor(private readonly rootDir: string) {}

  /**
   * Lazy, initialization-guarded access for composition: defers opening until
   * first use, and refuses — instead of creating storage — when the project
   * has not been initialized.
   */
  get connection(): Database.Database {
    this.proxy ??= new Proxy({} as Database.Database, {
      get: (_target, property) => {
        const db = this.openGuarded();
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    });
    return this.proxy;
  }

  /** The caller registers dispose before opening, including for partial failure. */
  open(): Database.Database {
    if (this.disposed) throw new Error("Local project database is disposed");
    if (this.db) return this.db;
    try {
      fs.ensureDirSync(this.rootDir);
      this.db = new Database(path.join(this.rootDir, "jumbo.db"));
      this.db.pragma("journal_mode = WAL");
      const infrastructureDir = fileURLToPath(new URL("../", import.meta.url));
      new MigrationRunner(this.db).runNamespaceMigrations(
        getNamespaceMigrations(infrastructureDir),
      );
      return this.db;
    } catch (error) {
      try {
        this.dispose();
      } catch (cleanupError) {
        // Keep the acquisition error even if checkpointing or closing also fails.
        try {
          console.error("Local project database cleanup failed", cleanupError);
        } catch {
          // Unavailable diagnostics must not replace the acquisition error either.
        }
      }
      throw error;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.db?.open) return;
    try {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
    } finally {
      // Checkpoint failure must not leave the connection open.
      this.db.close();
    }
  }

  private openGuarded(): Database.Database {
    if (!isProjectInitialized(this.rootDir)) {
      throw new ProjectNotInitializedError(CachedContextProject.get().path);
    }
    return this.open();
  }
}
