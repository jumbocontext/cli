import { ITelemetryEnvironmentReader } from "../../application/telemetry/ITelemetryEnvironmentReader.js";
import {
  CI_ENVIRONMENT_VARIABLE_NAMES,
  TELEMETRY_DISABLED_ENVIRONMENT_VARIABLE,
} from "./TelemetryEnvironmentVariables.js";

export class ProcessTelemetryEnvironmentReader implements ITelemetryEnvironmentReader {
  isCiEnvironment(): boolean {
    return CI_ENVIRONMENT_VARIABLE_NAMES.some((name) =>
      this.hasTruthyEnvironmentVariable(name),
    );
  }

  isTelemetryDisabledByEnvironment(): boolean {
    return process.env[TELEMETRY_DISABLED_ENVIRONMENT_VARIABLE] === "1";
  }

  private hasTruthyEnvironmentVariable(name: string): boolean {
    const value = process.env[name];
    return typeof value === "string" && value.length > 0;
  }
}
