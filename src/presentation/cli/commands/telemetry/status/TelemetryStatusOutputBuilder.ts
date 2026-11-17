import { GetTelemetryStatusResponse } from "../../../../../application/context/telemetry/get/GetTelemetryStatusResponse.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";

export class TelemetryStatusOutputBuilder {
  private readonly builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(response: GetTelemetryStatusResponse): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(this.buildHumanReadablePrompt(response));
    this.builder.addData(this.buildStructuredOutput(response));
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Failed to read telemetry status");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }

  buildStructuredOutput(response: GetTelemetryStatusResponse) {
    return {
      configured: response.configured,
      enabled: response.enabled,
      effectiveEnabled: response.effectiveEnabled,
      anonymousId: response.anonymousId,
      disabledByCi: response.disabledByCi,
      disabledByEnvironment: response.disabledByEnvironment,
    };
  }

  private buildHumanReadablePrompt(
    response: GetTelemetryStatusResponse,
  ): string {
    return [
      "Telemetry status",
      `Configured: ${response.configured ? "yes" : "no"}`,
      `Consent: ${response.enabled ? "enabled" : "disabled"}`,
      `Effective status: ${response.effectiveEnabled ? "enabled" : "disabled"}`,
      `Anonymous ID: ${response.anonymousId ?? "not generated"}`,
      `CI detected: ${response.disabledByCi ? "yes" : "no"}`,
      `Environment override: ${response.disabledByEnvironment ? "yes" : "no"}`,
    ].join("\n");
  }
}
