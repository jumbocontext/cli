import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { FsSettingsInitializer } from "../../../../src/infrastructure/settings/FsSettingsInitializer.js";
import { FsSettingsReader } from "../../../../src/infrastructure/settings/FsSettingsReader.js";
import { DEFAULT_SETTINGS } from "../../../../src/infrastructure/settings/DefaultSettings.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-settings-init-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("FsSettingsInitializer", () => {
  it("creates settings with null project identity", async () => {
    const tempDir = await createTempDir();
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const settings = await new FsSettingsReader(tempDir).read();
    expect(settings.project).toEqual(DEFAULT_SETTINGS.project);
  });

  it("creates settings with default session backlog preview size", async () => {
    const tempDir = await createTempDir();
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const settings = await new FsSettingsReader(tempDir).read();
    expect(settings.session).toEqual(DEFAULT_SETTINGS.session);
  });

  it("adds missing default sections to an existing settings file", async () => {
    const tempDir = await createTempDir();
    const settingsPath = path.join(tempDir, "settings.json");
    await fs.writeFile(
      settingsPath,
      JSON.stringify({
        qa: { defaultTurnLimit: 7 },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
      }),
      "utf-8",
    );
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const settings = await new FsSettingsReader(tempDir).read();
    expect(settings.project).toEqual(DEFAULT_SETTINGS.project);
    expect(settings.tui).toEqual(DEFAULT_SETTINGS.tui);
    expect(settings.session).toEqual(DEFAULT_SETTINGS.session);
  });

  it("preserves explicit known values already present in the settings file", async () => {
    const tempDir = await createTempDir();
    const settingsPath = path.join(tempDir, "settings.json");
    await fs.writeFile(
      settingsPath,
      JSON.stringify({
        project: { id: "11111111-1111-4111-8111-111111111111" },
        qa: { defaultTurnLimit: 7 },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
        tui: { showLaunchpadWelcome: false },
        session: { backlogPreviewSize: 2 },
      }),
      "utf-8",
    );
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const settings = await new FsSettingsReader(tempDir).read();
    expect(settings.project).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(settings.qa).toEqual({ defaultTurnLimit: 7 });
    expect(settings.claims).toEqual({ claimDurationMinutes: 45 });
    expect(settings.telemetry).toEqual({ enabled: false, anonymousId: null, consentGiven: true });
    expect(settings.tui).toEqual({ showLaunchpadWelcome: false });
    expect(settings.session).toEqual({ backlogPreviewSize: 2 });
  });

  it("preserves unknown top-level and nested entries when filling in defaults", async () => {
    const tempDir = await createTempDir();
    const settingsPath = path.join(tempDir, "settings.json");
    await fs.writeFile(
      settingsPath,
      JSON.stringify({
        qa: { defaultTurnLimit: 7, customField: "keep-me" },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
        experimental: { flagA: true },
      }),
      "utf-8",
    );
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const rawContent = await fs.readFile(settingsPath, "utf-8");
    const raw = JSON.parse(
      rawContent
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"))
        .join("\n"),
    );
    expect(raw.qa.customField).toBe("keep-me");
    expect(raw.experimental).toEqual({ flagA: true });
  });

  it("throws a clear error instead of rewriting an invalid settings file", async () => {
    const tempDir = await createTempDir();
    const settingsPath = path.join(tempDir, "settings.json");
    await fs.writeFile(settingsPath, "{ invalid json ", "utf-8");
    const initializer = new FsSettingsInitializer(tempDir);

    await expect(initializer.ensureSettingsFileExists()).rejects.toThrow();

    const contentAfterFailure = await fs.readFile(settingsPath, "utf-8");
    expect(contentAfterFailure).toBe("{ invalid json ");
  });
});
