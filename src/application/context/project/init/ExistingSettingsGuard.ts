import * as fs from "node:fs";
import { ApplicationRoot } from "../../../host/ApplicationRoot.js";
import { CachedContextProject } from "../../../../infrastructure/host/ContextProject.js";

/** Thrown when Jumbo settings already exist for the context project. */
export class ExistingSettingsError extends Error {}

/**
 * Detects pre-existing Jumbo settings for the context project so that
 * initialization can refuse to run before creating any files or project data.
 *
 * The project root is always resolved from ContextProject; it is never
 * accepted as a parameter.
 */
export class ExistingSettingsGuard {
  constructor(
    private readonly applicationRoot: ApplicationRoot = ApplicationRoot.getInstance(),
  ) {}

  /** Throws {@link ExistingSettingsError} when Jumbo settings already exist. */
  assertInitializationAllowed(): void {
    const settingsPath = this.resolveSettingsPath();

    if (!fs.existsSync(settingsPath)) {
      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch (error) {
      throw new ExistingSettingsError(
        `Invalid Jumbo settings at ${settingsPath}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const identity = (
      parsed as { project?: { id?: unknown } } | null
    )?.project?.id;

    if (typeof identity !== "string" || identity.trim().length === 0) {
      throw new ExistingSettingsError(
        `Invalid Jumbo settings at ${settingsPath}: missing project identity`,
      );
    }

    throw new ExistingSettingsError(
      `Jumbo is already initialized in this project. ` +
        `Existing settings found at ${settingsPath}. ` +
        `Use 'jumbo project show' to inspect it.`,
    );
  }

  private resolveSettingsPath(): string {
    const projectRoot = CachedContextProject.get().path;
    return this.applicationRoot.getProjectSettings(projectRoot);
  }
}
