import { UpdateTelemetryConsentResponse } from "../../../../../application/context/telemetry/update/UpdateTelemetryConsentResponse.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";

export class TelemetryDisableOutputBuilder {
  private readonly builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(response: UpdateTelemetryConsentResponse): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(this.buildHumanReadablePrompt(response));
    this.builder.addData(this.buildStructuredOutput(response));
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Failed to disable telemetry");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }

  buildStructuredOutput(response: UpdateTelemetryConsentResponse) {
    return {
      enabled: response.enabled,
      effectiveEnabled: response.effectiveEnabled,
      anonymousId: response.anonymousId,
      disabledByCi: response.disabledByCi,
      disabledByEnvironment: response.disabledByEnvironment,
      generatedAnonymousId: response.generatedAnonymousId,
    };
  }

  private buildHumanReadablePrompt(
    response: UpdateTelemetryConsentResponse,
  ): string {
    return [
      "Telemetry disabled",
      `Effective status: ${response.effectiveEnabled ? "enabled" : "disabled"}`,
      `Anonymous ID: ${response.anonymousId ?? "not generated"}`,
      `CI detected: ${response.disabledByCi ? "yes" : "no"}`,
      `Environment override: ${response.disabledByEnvironment ? "yes" : "no"}`,
    ].join("\n");
  }
}
