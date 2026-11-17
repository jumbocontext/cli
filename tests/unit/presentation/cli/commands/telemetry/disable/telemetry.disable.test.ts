import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { telemetryDisable } from "../../../../../../../src/presentation/cli/commands/telemetry/disable/telemetry.disable.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { UpdateTelemetryConsentController } from "../../../../../../../src/application/context/telemetry/update/UpdateTelemetryConsentController.js";

describe("telemetry.disable command", () => {
  let mockDependencies: {
    updateTelemetryConsentController: UpdateTelemetryConsentController;
  };
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockDependencies = {
      updateTelemetryConsentController: {
        handle: jest.fn().mockResolvedValue({
          enabled: false,
          effectiveEnabled: false,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
          generatedAnonymousId: false,
        }),
      } as unknown as UpdateTelemetryConsentController,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
  });

  it("renders text output when telemetry is disabled", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await telemetryDisable(mockDependencies);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Telemetry disabled");
    expect(output).toContain("Anonymous ID: anon-123");
  });
});
