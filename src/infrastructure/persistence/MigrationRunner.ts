import { Database } from "better-sqlite3";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

interface MigrationRecord {
  namespace: string;
  version: number;
  name: string;
  path: string;
}

function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

function isMissingSchemaMigrationsTableError(error: unknown): boolean {
  return (
    hasErrorMessage(error) &&
    error.message.includes("no such table: schema_migrations")
  );
}

/**
 * Manages database schema migrations with namespace-based version tracking.
 *
 * Implements Clean Screaming Architecture migration pattern:
 * - Migrations are organized by namespace (e.g., "work/sessions", "solution/decisions")
 * - Each namespace has its own version sequence starting at 001
 * - Tracks which migrations have been applied per namespace
 * - Runs migrations sequentially within each namespace
 * - Only runs each migration once
 * - Stores migration history in database with namespace as part of the key
 *
 * @see docs/work/phase-3/migration-strategy.md
 */
export class MigrationRunner {
  constructor(private readonly db: Database) {}

  /**
   * Create schema_migrations table if it doesn't exist.
   * Uses composite primary key of (namespace, version) to support
   * namespace-specific versioning.
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        namespace TEXT NOT NULL,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        checksum TEXT,
        PRIMARY KEY (namespace, version)
      );
    `);
  }

  /**
   * Get set of applied migrations as "namespace:version" strings
   */
  private getAppliedMigrations(): Set<string> {
    const rows = this.db
      .prepare("SELECT namespace, version FROM schema_migrations")
      .all() as Array<{ namespace: string; version: number }>;
    return new Set(rows.map((r) => `${r.namespace}:${r.version}`));
  }

  /**
   * Get count of applied migrations without loading every row.
   *
   * A missing schema_migrations table means nothing has been applied yet.
   */
  private getAppliedMigrationCount(): number {
    try {
      const row = this.db
        .prepare("SELECT COUNT(*) as count FROM schema_migrations")
        .get() as { count: number };
      return row.count;
    } catch (error) {
      if (isMissingSchemaMigrationsTableError(error)) {
        return 0;
      }

      throw error;
    }
  }

  /**
   * Get list of available migration files from a single directory
   */
  private getMigrationsFromDirectory(
    migrationsDir: string,
    namespace: string,
  ): MigrationRecord[] {
    if (!fs.existsSync(migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(migrationsDir);

    return files
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const match = f.match(/^(\d+)-(.+)\.sql$/);
        if (!match) {
          throw new Error(
            `Invalid migration filename: ${f} in ${namespace}. Expected format: NNN-description.sql`,
          );
        }
        return {
          namespace,
          version: parseInt(match[1], 10),
          name: match[2],
          path: path.join(migrationsDir, f),
        };
      })
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Calculate checksum of migration file content
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Run all pending migrations from multiple namespace directories.
   *
   * @param namespaceDirs - Array of {namespace, path} objects specifying
   *                        the namespace name and directory path for each
   *                        migration folder.
   */
  runNamespaceMigrations(
    namespaceDirs: Array<{ namespace: string; path: string }>,
  ): void {
    // Collect all migrations from all namespaces
    const allMigrations: MigrationRecord[] = [];
    for (const { namespace, path: dirPath } of namespaceDirs) {
      const migrations = this.getMigrationsFromDirectory(dirPath, namespace);
      allMigrations.push(...migrations);
    }

    const appliedCount = this.getAppliedMigrationCount();
    if (appliedCount === allMigrations.length) {
      return;
    }

    this.ensureMigrationsTable();
    const applied = this.getAppliedMigrations();

    // Filter to pending migrations
    const pending = allMigrations.filter(
      (m) => !applied.has(`${m.namespace}:${m.version}`),
    );

    if (pending.length === 0) {
      // No migrations to run
      return;
    }

    console.error(`Running ${pending.length} pending migrations...`);

    for (const migration of pending) {
      console.error(
        `  Applying migration ${migration.namespace}:${migration.version} (${migration.name})`,
      );

      const sql = fs.readFileSync(migration.path, "utf-8");
      const checksum = this.calculateChecksum(sql);

      // Run migration in transaction
      this.db.transaction(() => {
        // Execute migration SQL
        this.db.exec(sql);

        // Record migration as applied
        this.db
          .prepare(
            `INSERT INTO schema_migrations (namespace, version, name, applied_at, checksum)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(
            migration.namespace,
            migration.version,
            migration.name,
            new Date().toISOString(),
            checksum,
          );
      })();

      console.error(
        `  ✓ Migration ${migration.namespace}:${migration.version} applied successfully`,
      );
    }

    console.error("All migrations applied successfully");
  }

  /**
   * Verify migration checksums (detect tampering)
   */
  verifyNamespaceMigrations(
    namespaceDirs: Array<{ namespace: string; path: string }>,
  ): boolean {
    let applied: Array<{
      namespace: string;
      version: number;
      name: string;
      checksum: string;
    }>;

    try {
      applied = this.db
        .prepare(
          "SELECT namespace, version, name, checksum FROM schema_migrations ORDER BY namespace, version",
        )
        .all() as Array<{
        namespace: string;
        version: number;
        name: string;
        checksum: string;
      }>;
    } catch (error) {
      if (isMissingSchemaMigrationsTableError(error)) {
        return true;
      }

      throw error;
    }

    // Build a map of available migrations by namespace:version
    const availableMap = new Map<string, MigrationRecord>();
    for (const { namespace, path: dirPath } of namespaceDirs) {
      const migrations = this.getMigrationsFromDirectory(dirPath, namespace);
      for (const m of migrations) {
        availableMap.set(`${m.namespace}:${m.version}`, m);
      }
    }

    for (const record of applied) {
      const key = `${record.namespace}:${record.version}`;
      const migration = availableMap.get(key);

      if (!migration) {
        console.warn(
          `⚠ Warning: Migration ${record.namespace}:${record.version} (${record.name}) has been deleted`,
        );
        continue;
      }

      const sql = fs.readFileSync(migration.path, "utf-8");
      const checksum = this.calculateChecksum(sql);

      if (checksum !== record.checksum) {
        console.error(
          `❌ ERROR: Migration ${record.namespace}:${record.version} (${record.name}) has been modified since it was applied!`,
        );
        return false;
      }
    }

    return true;
  }
}
