import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { FsSettingsReader } from "../../../../src/infrastructure/settings/FsSettingsReader.js";
import { DEFAULT_SETTINGS } from "../../../../src/infrastructure/settings/DefaultSettings.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-settings-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("FsSettingsReader", () => {
  it("merges project identity defaults when existing settings do not include them", async () => {
    const tempDir = await createTempDir();
    await fs.writeFile(
      path.join(tempDir, "settings.json"),
      JSON.stringify({
        qa: { defaultTurnLimit: 7 },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
      }),
      "utf-8",
    );
    const reader = new FsSettingsReader(tempDir);

    const settings = await reader.read();

    expect(settings.project).toEqual(DEFAULT_SETTINGS.project);
  });

  it("merges TUI defaults when existing settings do not include them", async () => {
    const tempDir = await createTempDir();
    await fs.writeFile(
      path.join(tempDir, "settings.json"),
      JSON.stringify({
        qa: { defaultTurnLimit: 7 },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
      }),
      "utf-8",
    );
    const reader = new FsSettingsReader(tempDir);

    const settings = await reader.read();

    expect(settings.tui).toEqual(DEFAULT_SETTINGS.tui);
  });

  it("merges session backlog preview defaults when existing settings do not include them", async () => {
    const tempDir = await createTempDir();
    await fs.writeFile(
      path.join(tempDir, "settings.json"),
      JSON.stringify({
        qa: { defaultTurnLimit: 7 },
        claims: { claimDurationMinutes: 45 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: true },
      }),
      "utf-8",
    );
    const reader = new FsSettingsReader(tempDir);

    const settings = await reader.read();

    expect(settings.session).toEqual(DEFAULT_SETTINGS.session);
  });

  it("persists TUI preferences through the settings file", async () => {
    const tempDir = await createTempDir();
    const reader = new FsSettingsReader(tempDir);

    await reader.write({
      ...DEFAULT_SETTINGS,
      tui: { showLaunchpadWelcome: false },
    });

    await expect(reader.read()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      tui: { showLaunchpadWelcome: false },
    });
  });

  it("persists project identity through the settings file", async () => {
    const tempDir = await createTempDir();
    const reader = new FsSettingsReader(tempDir);
    const projectId = "11111111-1111-4111-8111-111111111111";

    await reader.write({
      ...DEFAULT_SETTINGS,
      project: { id: projectId },
    });

    await expect(reader.read()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      project: { id: projectId },
    });
  });

  it("persists session backlog preview size through the settings file", async () => {
    const tempDir = await createTempDir();
    const reader = new FsSettingsReader(tempDir);

    await reader.write({
      ...DEFAULT_SETTINGS,
      session: { backlogPreviewSize: 2 },
    });

    await expect(reader.read()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      session: { backlogPreviewSize: 2 },
    });
  });

  it("preserves unknown top-level and nested entries when persisting known settings changes", async () => {
    const tempDir = await createTempDir();
    const settingsPath = path.join(tempDir, "settings.json");
    await fs.writeFile(
      settingsPath,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        qa: { defaultTurnLimit: 3, customField: "keep-me" },
        experimental: { flagA: true },
      }),
      "utf-8",
    );
    const reader = new FsSettingsReader(tempDir);

    await reader.write({
      ...DEFAULT_SETTINGS,
      tui: { showLaunchpadWelcome: false },
    });

    const rawContent = await fs.readFile(settingsPath, "utf-8");
    const raw = JSON.parse(rawContent);
    expect(raw.qa.customField).toBe("keep-me");
    expect(raw.experimental).toEqual({ flagA: true });

    const settings = await reader.read();
    expect(settings.tui).toEqual({ showLaunchpadWelcome: false });
  });
});
