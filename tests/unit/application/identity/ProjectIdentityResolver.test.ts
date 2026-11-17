import { describe, expect, it, jest } from "@jest/globals";
import { ProjectIdentityResolver } from "../../../../src/application/identity/ProjectIdentityResolver.js";
import { ISettingsReader } from "../../../../src/application/settings/ISettingsReader.js";
import { Settings } from "../../../../src/application/settings/Settings.js";
import { DEFAULT_SETTINGS } from "../../../../src/infrastructure/settings/DefaultSettings.js";

describe("ProjectIdentityResolver", () => {
  function createSettings(overrides: Partial<Settings> = {}): Settings {
    return {
      ...DEFAULT_SETTINGS,
      ...overrides,
    };
  }

  function createReader(settings: Settings): jest.Mocked<ISettingsReader> {
    let currentSettings = settings;
    return {
      read: jest.fn(async () => currentSettings),
      write: jest.fn(async (nextSettings: Settings) => {
        currentSettings = nextSettings;
      }),
      hasTelemetryConfiguration: jest.fn(),
    };
  }

  it("generates project ids through the configured id generator", () => {
    const reader = createReader(createSettings());
    const resolver = new ProjectIdentityResolver(
      reader,
      () => "11111111-1111-4111-8111-111111111111",
    );

    expect(resolver.generateProjectId()).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("persists a generated project id in settings", async () => {
    const reader = createReader(createSettings());
    const resolver = new ProjectIdentityResolver(reader);

    await resolver.persistProjectId("11111111-1111-4111-8111-111111111111");

    expect(reader.write).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      project: {
        id: "11111111-1111-4111-8111-111111111111",
      },
    });
  });

  it("reuses a configured project id when its event stream exists", async () => {
    const reader = createReader(
      createSettings({
        project: { id: "22222222-2222-4222-8222-222222222222" },
      }),
    );
    const resolver = new ProjectIdentityResolver(reader);
    const hasProjectHistory = jest.fn(async () => true);

    await expect(
      resolver.resolveExistingProjectId("project", hasProjectHistory),
    ).resolves.toBe("22222222-2222-4222-8222-222222222222");
    expect(reader.write).not.toHaveBeenCalled();
  });

  it("migrates missing settings to the currently projected project id", async () => {
    const reader = createReader(createSettings({ project: { id: null } }));
    const resolver = new ProjectIdentityResolver(reader);

    await expect(
      resolver.resolveExistingProjectId("project"),
    ).resolves.toBe("project");

    expect(reader.write).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      project: { id: "project" },
    });
  });

  it("falls back to the projected id when configured settings point to no project history", async () => {
    const reader = createReader(
      createSettings({
        project: { id: "33333333-3333-4333-8333-333333333333" },
      }),
    );
    const resolver = new ProjectIdentityResolver(reader);
    const hasProjectHistory = jest.fn(async (projectId: string) => projectId === "project");

    await expect(
      resolver.resolveExistingProjectId("project", hasProjectHistory),
    ).resolves.toBe("project");

    expect(reader.write).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      project: { id: "project" },
    });
  });
});
