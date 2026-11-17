import fs from "fs-extra";
import path from "node:path";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { parse, type ParseError } from "jsonc-parser";
import { ApplicationRoot } from "../application/host/ApplicationRoot.js";
import { CachedContextProject } from "../infrastructure/host/ContextProject.js";
import { LegacyInstallationDetector } from "./LegacyInstallationDetector.js";

type LegacySettings = Record<string, unknown> & {
  project?: Record<string, unknown>;
  connection?: Record<string, unknown>;
};

/** Explicit copy-only conversion. Never used as an ordinary execution path. */
export class LegacyInstallationMigrator {
  private readonly root = ApplicationRoot.getInstance();

  async migrate(): Promise<string> {
    const contextProject = CachedContextProject.get();
    const contextProjectPath = contextProject.path;
    const cwd = await fs.realpath(process.cwd());
    if (cwd !== contextProjectPath) {
      throw new Error(
        `Run \`jumbo migrate\` from the main project root: ${contextProjectPath}`,
      );
    }
    const legacyRoot = new LegacyInstallationDetector().find(cwd);
    if (!legacyRoot) throw new Error("No legacy Jumbo installation found");
    if (legacyRoot !== cwd)
      throw new Error(
        `Run \`jumbo migrate\` from the legacy project root: ${legacyRoot}`,
      );
    const source = path.join(cwd, ".jumbo");
    if (!(await fs.pathExists(path.join(source, "jumbo.db")))) {
      throw new Error(
        "Legacy project database is missing; restore it before migrating. No replacement database will be initialized.",
      );
    }
    const relativeRoot = path.relative(
      await fs.realpath(source),
      await this.physicalPath(this.root.path),
    );
    if (
      relativeRoot === "" ||
      (!path.isAbsolute(relativeRoot) &&
        relativeRoot !== ".." &&
        !relativeRoot.startsWith(`..${path.sep}`))
    ) {
      throw new Error("Application root cannot be inside legacy storage");
    }
    const destination = this.root.getProjectDirectory(cwd);
    await fs.ensureDir(this.root.projectsDirectory);
    const lock = `${destination}.migration-lock`;
    await fs.mkdir(lock); // Exclusive across concurrent migrators; never steal another process's lock.
    let staging: string | undefined;
    try {
      if (await fs.pathExists(destination))
        throw new Error(
          "Migration destination already exists; refusing to overwrite it",
        );
      const original = await this.fingerprint(source);
      const settings = await this.readSettings(source);
      const projectId = await this.resolveIdentity(source, settings);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(projectId)) {
        throw new Error("Invalid legacy project identity");
      }
      staging = await fs.mkdtemp(
        path.join(this.root.projectsDirectory, ".migration-"),
      );
      await fs.copy(source, staging, {
        dereference: false,
        filter: async (entry) => {
          if ((await fs.lstat(entry)).isSymbolicLink())
            throw new Error(
              `Legacy symbolic links require manual migration: ${entry}`,
            );
          return !["jumbo.db", "jumbo.db-wal", "jumbo.db-shm"].includes(
            path.relative(source, entry),
          );
        },
      });
      // Open only a staged snapshot: even SQLite readonly connections can create source WAL sidecars.
      // Legacy writers must be stopped; retain the WAL when snapshotting committed data.
      const databaseFile = path.join(source, "jumbo.db");
      if (await fs.pathExists(databaseFile)) {
        const snapshot = await fs.mkdtemp(path.join(staging, ".database-"));
        try {
          await fs.copyFile(databaseFile, path.join(snapshot, "jumbo.db"));
          if (await fs.pathExists(`${databaseFile}-wal`))
            await fs.copyFile(
              `${databaseFile}-wal`,
              path.join(snapshot, "jumbo.db-wal"),
            );
          const db = new Database(path.join(snapshot, "jumbo.db"), {
            fileMustExist: true,
          });
          try {
            if (db.pragma("quick_check", { simple: true }) !== "ok")
              throw new Error("Legacy database failed integrity validation");
            await db.backup(path.join(staging, "jumbo.db"));
          } finally {
            db.close();
          }
        } finally {
          await fs.remove(snapshot);
        }
      }
      settings.project = { ...settings.project, id: projectId };
      settings.connection = { ...settings.connection, backend: "local" };
      await fs.writeJson(path.join(staging, "settings.json"), settings, {
        spaces: 2,
      });
      await fs.remove(path.join(staging, "settings.jsonc"));
      if (original !== (await this.fingerprint(source))) {
        throw new Error(
          "Legacy artifacts changed during migration. Stop legacy Jumbo processes before retrying.",
        );
      }
      // Publish the validated directory atomically. Discovery needs no registration.
      await fs.rename(staging, destination);
      staging = undefined;
      return destination;
    } finally {
      if (staging) await fs.remove(staging);
      await fs.remove(lock);
    }
  }

  /** Resolve existing symlinked ancestors before creating a destination. */
  private async physicalPath(location: string): Promise<string> {
    let ancestor = location;
    const remainder: string[] = [];
    while (!(await fs.pathExists(ancestor))) {
      remainder.unshift(path.basename(ancestor));
      const parent = path.dirname(ancestor);
      if (parent === ancestor)
        throw new Error("Application root has no existing filesystem ancestor");
      ancestor = parent;
    }
    return path.join(await fs.realpath(ancestor), ...remainder);
  }

  private async fingerprint(source: string): Promise<string> {
    const entries: string[] = [];
    const walk = async (location: string): Promise<void> => {
      const stat = await fs.lstat(location);
      if (stat.isSymbolicLink())
        throw new Error(
          `Legacy symbolic links require manual migration: ${location}`,
        );
      if (!stat.isDirectory() && !stat.isFile())
        throw new Error(`Unsupported legacy artifact: ${location}`);
      entries.push(
        JSON.stringify([
          path.relative(source, location),
          stat.isDirectory()
            ? "directory"
            : createHash("sha256")
                .update(await fs.readFile(location))
                .digest("hex"),
        ]),
      );
      if (stat.isDirectory())
        for (const name of (await fs.readdir(location)).sort())
          await walk(path.join(location, name));
    };
    await walk(source);
    return entries.join("\n");
  }

  private async readSettings(source: string): Promise<LegacySettings> {
    const file = path.join(source, "settings.jsonc");
    if (!(await fs.pathExists(file))) return {};
    const errors: ParseError[] = [];
    const settings: unknown = parse(await fs.readFile(file, "utf8"), errors, {
      allowTrailingComma: true,
    });
    if (
      errors.length ||
      !settings ||
      typeof settings !== "object" ||
      Array.isArray(settings)
    ) {
      throw new Error(`Invalid legacy settings at ${file}`);
    }
    for (const key of ["project", "connection"]) {
      const value = (settings as Record<string, unknown>)[key];
      if (value != null && (typeof value !== "object" || Array.isArray(value)))
        throw new Error(`Invalid legacy ${key} settings`);
    }
    return settings as LegacySettings;
  }

  private async resolveIdentity(
    source: string,
    settings: LegacySettings,
  ): Promise<string> {
    const ids = new Set<string>();
    if (settings.project?.id != null) {
      if (
        typeof settings.project.id !== "string" ||
        !settings.project.id.trim()
      )
        throw new Error("Invalid legacy project identity");
      ids.add(settings.project.id);
    }
    // Older installations may predate settings identity. Recover it from authoritative history, never generate one.
    const events = path.join(source, "events");
    if (await fs.pathExists(events)) {
      for (const stream of await fs.readdir(events, { withFileTypes: true })) {
        if (!stream.isDirectory()) continue;
        for (const file of await fs.readdir(path.join(events, stream.name))) {
          if (!file.endsWith(".ProjectInitializedEvent.json")) continue;
          const event = await fs.readJson(path.join(events, stream.name, file));
          if (
            event.type !== "ProjectInitializedEvent" ||
            event.aggregateId !== stream.name
          )
            throw new Error("Invalid legacy project initialization event");
          ids.add(event.aggregateId);
        }
      }
    }
    if (ids.size !== 1)
      throw new Error(
        "Legacy project identity is missing or inconsistent; migration cannot safely continue",
      );
    return [...ids][0];
  }
}
