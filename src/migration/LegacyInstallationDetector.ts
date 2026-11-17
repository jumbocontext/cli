import { existsSync, realpathSync, statSync } from "node:fs";
import { ApplicationRoot } from "../application/host/ApplicationRoot.js";
import path from "node:path";

/**
 * The only legacy probe used by normal startup; it never reads settings or opens data.
 *
 * Project-root resolution is ContextProjectPath's responsibility. This probe
 * only checks whether legacy data artifacts exist where the old paradigm kept
 * them, relative to the given project root.
 */
export class LegacyInstallationDetector {
  private readonly applicationRoot = ApplicationRoot.getInstance();

  find(projectRoot: string): string | null {
    const applicationLocation = existsSync(this.applicationRoot.path)
      ? realpathSync(this.applicationRoot.path)
      : this.applicationRoot.path;
    const candidate = path.join(projectRoot, ".jumbo");
    if (
      existsSync(candidate) &&
      statSync(candidate).isDirectory() &&
      path.relative(applicationLocation, realpathSync(candidate)) !== ""
    )
      return projectRoot;
    return null;
  }
}
