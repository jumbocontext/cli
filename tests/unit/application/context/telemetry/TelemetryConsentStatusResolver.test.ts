import { describe, expect, it } from "@jest/globals";
import { TelemetryConsentStatusResolver } from "../../../../../src/application/context/telemetry/TelemetryConsentStatusResolver.js";

describe("TelemetryConsentStatusResolver", () => {
  it("enables telemetry only when consent is granted and runtime allows it", () => {
    const resolver = new TelemetryConsentStatusResolver();

    const result = resolver.resolve(
      {
        qa: { defaultTurnLimit: 3 },
        claims: { claimDurationMinutes: 30 },
        telemetry: { enabled: true, anonymousId: "anon-123", consentGiven: true },
      },
      true,
      {
        ciDetected: false,
        environmentDisabled: false,
      }
    );

    expect(result).toEqual({
      configured: true,
      enabled: true,
      effectiveEnabled: true,
      anonymousId: "anon-123",
      disabledByCi: false,
      disabledByEnvironment: false,
    });
  });

  it("disables telemetry effectively when CI or env override is active", () => {
    const resolver = new TelemetryConsentStatusResolver();

    const result = resolver.resolve(
      {
        qa: { defaultTurnLimit: 3 },
        claims: { claimDurationMinutes: 30 },
        telemetry: { enabled: true, anonymousId: "anon-123", consentGiven: true },
      },
      true,
      {
        ciDetected: true,
        environmentDisabled: false,
      }
    );

    expect(result.effectiveEnabled).toBe(false);
    expect(result.disabledByCi).toBe(true);
  });
});
