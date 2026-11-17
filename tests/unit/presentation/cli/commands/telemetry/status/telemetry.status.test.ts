import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { telemetryStatus } from "../../../../../../../src/presentation/cli/commands/telemetry/status/telemetry.status.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { GetTelemetryStatusController } from "../../../../../../../src/application/context/telemetry/get/GetTelemetryStatusController.js";

describe("telemetry.status command", () => {
  let mockDependencies: {
    getTelemetryStatusController: GetTelemetryStatusController;
  };
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockDependencies = {
      getTelemetryStatusController: {
        handle: jest.fn().mockResolvedValue({
          configured: true,
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
        }),
      } as unknown as GetTelemetryStatusController,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
  });

  it("renders text output with consent state and anonymous ID", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await telemetryStatus(mockDependencies);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Telemetry status");
    expect(output).toContain("Anonymous ID: anon-123");
  });

  it("renders structured output in json mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await telemetryStatus(mockDependencies);

    const parsed = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
    expect(parsed.anonymousId).toBe("anon-123");
    expect(parsed.effectiveEnabled).toBe(true);
  });
});
