import fs from "fs-extra";
import path from "path";
import * as jsonc from "jsonc-parser";
import { ISettingsReader } from "../../application/settings/ISettingsReader.js";
import { Settings } from "../../application/settings/Settings.js";
import { DEFAULT_SETTINGS } from "./DefaultSettings.js";
import { JsonValue, setJsoncValue } from "./JsoncSettingsEditor.js";

/**
 * JsoncSettingsReader - File system implementation for reading settings.
 *
 * Reads settings from the project's convention-derived settings.json file.
 * Creates the file with defaults if it doesn't exist.
 * Supports JSONC format (JSON with comments).
 */
export class FsSettingsReader implements ISettingsReader {
  private readonly settingsFilePath: string;

  constructor(rootDir: string) {
    this.settingsFilePath = path.join(rootDir, "settings.json");
  }

  async read(): Promise<Settings> {
    if (!(await fs.pathExists(this.settingsFilePath))) {
      return DEFAULT_SETTINGS;
    }

    // Read and parse existing file
    try {
      const content = await fs.readFile(this.settingsFilePath, "utf-8");
      const errors: jsonc.ParseError[] = [];
      const settings = jsonc.parse(content, errors, {
        allowTrailingComma: true,
      }) as Settings;

      if (errors.length > 0) {
        throw new Error(
          `Invalid JSON in settings file: ${this.formatParseErrors(errors)}`,
        );
      }

      // Merge with defaults to handle missing fields
      return this.mergeWithDefaults(settings);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to read settings file at ${this.settingsFilePath}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async write(settings: Settings): Promise<void> {
    const normalizedSettings = this.mergeWithDefaults(settings);

    await fs.ensureDir(path.dirname(this.settingsFilePath));

    if (!(await fs.pathExists(this.settingsFilePath))) {
      const content = this.buildSettingsFileContent(normalizedSettings);
      await fs.writeFile(this.settingsFilePath, content, "utf-8");
      return;
    }

    const existingContent = await fs.readFile(this.settingsFilePath, "utf-8");
    const errors: jsonc.ParseError[] = [];
    jsonc.parse(existingContent, errors, { allowTrailingComma: true });
    if (errors.length > 0) {
      throw new Error(
        `Invalid JSON in settings file: ${this.formatParseErrors(errors)}`,
      );
    }

    let updated = existingContent;
    for (const { path: fieldPath, value } of this.knownValueEntries(
      normalizedSettings,
    )) {
      updated = setJsoncValue(updated, fieldPath, value);
    }
    await fs.writeFile(this.settingsFilePath, updated, "utf-8");
  }

  /**
   * Known settings leaf paths and their values, used to persist changes onto
   * an existing settings file without disturbing unknown entries elsewhere
   * in the document.
   */
  private knownValueEntries(
    settings: Settings,
  ): Array<{ path: jsonc.JSONPath; value: JsonValue }> {
    return [
      { path: ["project", "id"], value: settings.project!.id },
      { path: ["qa", "defaultTurnLimit"], value: settings.qa.defaultTurnLimit },
      {
        path: ["claims", "claimDurationMinutes"],
        value: settings.claims.claimDurationMinutes,
      },
      { path: ["telemetry", "enabled"], value: settings.telemetry.enabled },
      {
        path: ["telemetry", "anonymousId"],
        value: settings.telemetry.anonymousId,
      },
      {
        path: ["telemetry", "consentGiven"],
        value: settings.telemetry.consentGiven,
      },
      {
        path: ["tui", "showLaunchpadWelcome"],
        value: settings.tui!.showLaunchpadWelcome,
      },
      {
        path: ["session", "backlogPreviewSize"],
        value: settings.session!.backlogPreviewSize,
      },
    ];
  }

  async hasTelemetryConfiguration(): Promise<boolean> {
    if (!(await fs.pathExists(this.settingsFilePath))) {
      return false;
    }

    const parsed = await this.readRawSettings();
    const telemetry = parsed.telemetry;

    if (!telemetry || typeof telemetry !== "object") {
      return false;
    }

    return telemetry.consentGiven === true;
  }

  /**
   * Merge parsed settings with defaults to handle missing fields
   */
  private mergeWithDefaults(settings: Partial<Settings>): Settings {
    return {
      project: {
        id: settings.project?.id ?? DEFAULT_SETTINGS.project!.id,
      },
      qa: {
        defaultTurnLimit:
          settings.qa?.defaultTurnLimit ?? DEFAULT_SETTINGS.qa.defaultTurnLimit,
      },
      claims: {
        claimDurationMinutes:
          settings.claims?.claimDurationMinutes ??
          DEFAULT_SETTINGS.claims.claimDurationMinutes,
      },
      telemetry: {
        enabled:
          settings.telemetry?.enabled ?? DEFAULT_SETTINGS.telemetry.enabled,
        anonymousId:
          settings.telemetry?.anonymousId ??
          DEFAULT_SETTINGS.telemetry.anonymousId,
        consentGiven:
          settings.telemetry?.consentGiven ??
          DEFAULT_SETTINGS.telemetry.consentGiven,
      },
      tui: {
        showLaunchpadWelcome:
          settings.tui?.showLaunchpadWelcome ??
          DEFAULT_SETTINGS.tui!.showLaunchpadWelcome,
      },
      session: {
        backlogPreviewSize:
          settings.session?.backlogPreviewSize ??
          DEFAULT_SETTINGS.session!.backlogPreviewSize,
      },
    };
  }

  private buildSettingsFileContent(settings: Settings): string {
    return `${JSON.stringify({ ...settings, connection: { backend: "local" } }, null, 2)}\n`;
  }

  private async readRawSettings(): Promise<Partial<Settings>> {
    const content = await fs.readFile(this.settingsFilePath, "utf-8");
    const errors: jsonc.ParseError[] = [];
    const settings = jsonc.parse(content, errors, {
      allowTrailingComma: true,
    }) as Partial<Settings>;

    if (errors.length > 0) {
      throw new Error(
        `Invalid JSON in settings file: ${this.formatParseErrors(errors)}`,
      );
    }

    return settings;
  }

  /**
   * Format parse errors into a readable message
   */
  private formatParseErrors(errors: jsonc.ParseError[]): string {
    return errors
      .map(
        (err) =>
          `Error at offset ${err.offset}: ${jsonc.printParseErrorCode(err.error)}`,
      )
      .join(", ");
  }
}
