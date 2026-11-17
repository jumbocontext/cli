import { Settings } from "../../settings/Settings.js";
import { TelemetryEnvironmentStatus } from "./TelemetryEnvironmentStatus.js";

export interface ResolvedTelemetryConsentStatus {
  configured: boolean;
  enabled: boolean;
  effectiveEnabled: boolean;
  anonymousId: string | null;
  disabledByCi: boolean;
  disabledByEnvironment: boolean;
}

export class TelemetryConsentStatusResolver {
  resolve(
    settings: Settings,
    configured: boolean,
    environmentStatus: TelemetryEnvironmentStatus,
  ): ResolvedTelemetryConsentStatus {
    const disabledByCi = environmentStatus.ciDetected;
    const disabledByEnvironment = environmentStatus.environmentDisabled;

    return {
      configured,
      enabled: settings.telemetry.enabled,
      effectiveEnabled:
        settings.telemetry.enabled && !disabledByCi && !disabledByEnvironment,
      anonymousId: settings.telemetry.anonymousId,
      disabledByCi,
      disabledByEnvironment,
    };
  }
}
