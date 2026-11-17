import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("crypto", () => ({
  randomUUID: jest.fn(() => "generated-uuid"),
}));

const { UpdateTelemetryConsentCommandHandler } = await import("../../../../../../src/application/context/telemetry/update/UpdateTelemetryConsentCommandHandler.js");
import type { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader.js";

describe("UpdateTelemetryConsentCommandHandler", () => {
  let settingsReader: jest.Mocked<ISettingsReader>;
  let handler: InstanceType<typeof UpdateTelemetryConsentCommandHandler>;

  beforeEach(() => {
    settingsReader = {
      read: jest.fn(),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    } as jest.Mocked<ISettingsReader>;

    handler = new UpdateTelemetryConsentCommandHandler(settingsReader);
  });

  it("generates an anonymous ID on first enable", async () => {
    settingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: false, anonymousId: null, consentGiven: false },
    });

    const result = await handler.execute({ enabled: true });

    expect(result).toEqual({
      enabled: true,
      anonymousId: "generated-uuid",
      generatedAnonymousId: true,
    });
    expect(settingsReader.write).toHaveBeenCalledWith({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: true, anonymousId: "generated-uuid", consentGiven: true },
    });
  });

  it("disables telemetry without replacing an existing anonymous ID", async () => {
    settingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: true, anonymousId: "existing-id", consentGiven: true },
    });

    const result = await handler.execute({ enabled: false });

    expect(result).toEqual({
      enabled: false,
      anonymousId: "existing-id",
      generatedAnonymousId: false,
    });
  });
});
