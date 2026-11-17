import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { telemetryEnable } from "../../../../../../../src/presentation/cli/commands/telemetry/enable/telemetry.enable.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { UpdateTelemetryConsentController } from "../../../../../../../src/application/context/telemetry/update/UpdateTelemetryConsentController.js";

describe("telemetry.enable command", () => {
  let mockDependencies: {
    updateTelemetryConsentController: UpdateTelemetryConsentController;
  };
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockDependencies = {
      updateTelemetryConsentController: {
        handle: jest.fn().mockResolvedValue({
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
          generatedAnonymousId: true,
        }),
      } as unknown as UpdateTelemetryConsentController,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
  });

  it("renders text output when telemetry is enabled", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await telemetryEnable(mockDependencies);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Telemetry enabled");
    expect(output).toContain("Anonymous ID: anon-123");
  });
});
