import fs from "fs-extra";
import path from "node:path";
import type { ISettingsInitializer } from "../../application/settings/ISettingsInitializer.js";
import type { PlannedFileChange } from "../../application/context/project/init/PlannedFileChange.js";
import { DEFAULT_SETTINGS } from "./DefaultSettings.js";
import {
  JsonObject,
  applyMissingDefaults,
  assertValidJsonc,
} from "./JsoncSettingsEditor.js";

/** Project settings live beside its events, logs and database, never in the checkout. */
export class FsSettingsInitializer implements ISettingsInitializer {
  private readonly settingsFilePath: string;

  constructor(rootDir: string) {
    this.settingsFilePath = path.join(rootDir, "settings.json");
  }

  async ensureSettingsFileExists(): Promise<void> {
    const defaults = { ...DEFAULT_SETTINGS, connection: { backend: "local" } };
    if (!(await fs.pathExists(this.settingsFilePath))) {
      await fs.outputJson(this.settingsFilePath, defaults, { spaces: 2 });
      return;
    }
    const content = await fs.readFile(this.settingsFilePath, "utf8");
    assertValidJsonc(content, this.settingsFilePath);
    const updated = applyMissingDefaults(
      content,
      defaults as unknown as JsonObject,
    );
    if (updated !== content)
      await fs.writeFile(this.settingsFilePath, updated, "utf8");
  }

  async getPlannedFileChange(): Promise<PlannedFileChange | null> {
    if (await fs.pathExists(this.settingsFilePath)) return null;
    return {
      path: this.settingsFilePath,
      action: "create",
      description: "Jumbo project settings",
    };
  }
}
