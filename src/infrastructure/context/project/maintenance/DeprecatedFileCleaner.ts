import path from "node:path";
import fs from "fs-extra";
import { DEPRECATED_MANAGED_PATHS } from "./DeprecatedManagedPaths.js";

/** Idempotent, best-effort removal of explicitly retired project files and directories. */
export class DeprecatedFileCleaner {

  constructor(private readonly deprecatedPaths: readonly string[] = DEPRECATED_MANAGED_PATHS) {}

  async clean(projectRoot: string): Promise<void> {

    const root = path.resolve(projectRoot);
    for (const deprecatedPath of this.deprecatedPaths) {
      try {
        const target = path.resolve(root, deprecatedPath);
        const relative = path.relative(root, target);
        if (
          path.isAbsolute(deprecatedPath) ||
          relative === "" ||
          relative === ".." ||
          relative.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relative)
        ) {
          throw new Error("Deprecated paths must be relative paths within the project");
        }
        await fs.remove(target);
      } catch (error) {
        console.warn(
          `Warning: Failed to remove deprecated artifact '${deprecatedPath}': ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

  }
}
