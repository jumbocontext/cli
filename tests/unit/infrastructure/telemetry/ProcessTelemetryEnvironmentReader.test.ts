import { afterEach, describe, expect, it } from "@jest/globals";
import { ProcessTelemetryEnvironmentReader } from "../../../../src/infrastructure/telemetry/ProcessTelemetryEnvironmentReader.js";

describe("ProcessTelemetryEnvironmentReader", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("detects CI from supported environment variables", () => {
    process.env = {
      ...originalEnv,
      GITHUB_ACTIONS: "true",
    };

    const reader = new ProcessTelemetryEnvironmentReader();

    expect(reader.isCiEnvironment()).toBe(true);
  });

  it("returns false when no CI variables are set", () => {
    process.env = {};

    const reader = new ProcessTelemetryEnvironmentReader();

    expect(reader.isCiEnvironment()).toBe(false);
  });

  it("detects telemetry environment override", () => {
    process.env = {
      ...originalEnv,
      JUMBO_TELEMETRY_DISABLED: "1",
    };

    const reader = new ProcessTelemetryEnvironmentReader();

    expect(reader.isTelemetryDisabledByEnvironment()).toBe(true);
  });
});
