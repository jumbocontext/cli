import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { LocalGetTelemetryStatusGateway } from "../../../../../../src/application/context/telemetry/get/LocalGetTelemetryStatusGateway.js";
import { TelemetryConsentStatusResolver } from "../../../../../../src/application/context/telemetry/TelemetryConsentStatusResolver.js";
import { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader.js";
import { ITelemetryEnvironmentReader } from "../../../../../../src/application/telemetry/ITelemetryEnvironmentReader.js";
import { Settings } from "../../../../../../src/application/settings/Settings.js";

describe("LocalGetTelemetryStatusGateway", () => {
  let gateway: LocalGetTelemetryStatusGateway;
  let mockSettingsReader: jest.Mocked<ISettingsReader>;
  let mockEnvReader: jest.Mocked<ITelemetryEnvironmentReader>;
  let resolver: TelemetryConsentStatusResolver;

  const defaultSettings: Settings = {
    qa: { defaultTurnLimit: 3 },
    claims: { claimDurationMinutes: 30 },
    telemetry: { enabled: true, anonymousId: null, consentGiven: false },
  };

  beforeEach(() => {
    mockSettingsReader = {
      read: jest.fn<() => Promise<Settings>>().mockResolvedValue(defaultSettings),
      write: jest.fn<(s: Settings) => Promise<void>>().mockResolvedValue(undefined),
      hasTelemetryConfiguration: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
    };

    mockEnvReader = {
      isCiEnvironment: jest.fn<() => boolean>().mockReturnValue(false),
      isTelemetryDisabledByEnvironment: jest.fn<() => boolean>().mockReturnValue(false),
    };

    resolver = new TelemetryConsentStatusResolver();

    gateway = new LocalGetTelemetryStatusGateway(
      mockSettingsReader,
      mockEnvReader,
      resolver
    );
  });

  it("checks hasTelemetryConfiguration before read to avoid premature auto-creation", async () => {
    const callOrder: string[] = [];
    mockSettingsReader.hasTelemetryConfiguration.mockImplementation(async () => {
      callOrder.push("hasTelemetryConfiguration");
      return false;
    });
    mockSettingsReader.read.mockImplementation(async () => {
      callOrder.push("read");
      return defaultSettings;
    });

    await gateway.getTelemetryStatus({});

    expect(callOrder).toEqual(["hasTelemetryConfiguration", "read"]);
  });

  it("returns configured=false when settings file has no telemetry section", async () => {
    mockSettingsReader.hasTelemetryConfiguration.mockResolvedValue(false);

    const result = await gateway.getTelemetryStatus({});

    expect(result.configured).toBe(false);
  });

  it("returns configured=true when telemetry has been explicitly set", async () => {
    mockSettingsReader.hasTelemetryConfiguration.mockResolvedValue(true);

    const result = await gateway.getTelemetryStatus({});

    expect(result.configured).toBe(true);
  });
});
