import os from "node:os";
import path from "node:path";

/** One per-user application root. All ordinary Jumbo storage is derived from it. */
export class ApplicationRoot {
  private static instance: ApplicationRoot | undefined;

  readonly path: string;

  static getInstance(): ApplicationRoot {
    return (this.instance ??= new ApplicationRoot());
  }

  private constructor() {
    this.path = this.#resolvePath();
    Object.freeze(this);
  }

  #resolvePath(): string {
    const platform = process.platform;
    if (!["linux", "darwin", "win32"].includes(platform)) {
      throw new Error(`Unsupported application root platform: ${platform}`);
    }
    const home = this.#resolveHomeDirectory();
    return platform === "darwin"
      ? path.join(home, "Library", "Application Support", "jumbo")
      : path.join(home, ".jumbo");
  }

  #resolveHomeDirectory(): string {
    const home = os.homedir();
    if (
      typeof home !== "string" ||
      !path.isAbsolute(home) ||
      /[\0\r\n]/.test(home) ||
      (process.platform === "win32" &&
        !/^(?:[a-z]:[\\/]|[\\/]{2}[^\\/]+[\\/][^\\/]+)/i.test(home))
    ) {
      throw new Error("Application root requires an absolute home directory");
    }
    return home;
  }

  get settingsFile(): string {
    return path.join(this.path, "settings.json");
  }
  get projectsDirectory(): string {
    return path.join(this.path, "projects");
  }

  getProjectSettings(rootWorkspacePath: string): string {
    return path.join(
      this.#resolveProjectDirectory(rootWorkspacePath),
      "settings.json",
    );
  }

  getProjectEventsDirectory(rootWorkspacePath: string): string {
    return path.join(
      this.#resolveProjectDirectory(rootWorkspacePath),
      "events",
    );
  }

  getProjectLogsDirectory(rootWorkspacePath: string): string {
    return path.join(this.#resolveProjectDirectory(rootWorkspacePath), "logs");
  }

  getProjectDbFile(rootWorkspacePath: string): string {
    return path.join(
      this.#resolveProjectDirectory(rootWorkspacePath),
      "jumbo.db",
    );
  }

  /** Directory-level consumers use the same convention as individual file consumers. */
  getProjectDirectory(rootWorkspacePath: string): string {
    return this.#resolveProjectDirectory(rootWorkspacePath);
  }

  /** The full root-workspace path, not its basename or project ID, names storage. */
  #resolveProjectDirectory(rootWorkspacePath: string): string {
    if (
      !path.isAbsolute(rootWorkspacePath) ||
      /[\0\r\n]/.test(rootWorkspacePath)
    ) {
      throw new Error("Root workspace must be an absolute path");
    }
    const normalized = path.normalize(rootWorkspacePath);
    const key = `--${normalized
      .split(path.sep)
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment).replace(/-/g, "%2D"))
      .join("-")}--`;
    return path.join(this.projectsDirectory, key);
  }
}
