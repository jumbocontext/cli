import * as jsonc from "jsonc-parser";
import fs from "fs-extra";
import path from "node:path";

export function isProjectInitialized(projectDataDir: string): boolean {
  const settingsFilePath = path.join(projectDataDir, "settings.json");
  if (!fs.existsSync(settingsFilePath)) return false;

  let content: string;
  try {
    content = fs.readFileSync(settingsFilePath, "utf-8");
  } catch {
    // Unreadable settings are indeterminate, not uninitialized; let the
    // caller's own settings handling report the detailed failure.
    return true;
  }

  const settings = jsonc.parse(content, [], {
    allowTrailingComma: true,
  }) as { project?: { id?: unknown } } | undefined;

  const projectId = settings?.project?.id;
  return typeof projectId === "string" && projectId.trim().length > 0;
}
