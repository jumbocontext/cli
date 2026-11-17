import { ITelemetryEnvironmentReader } from "../../../telemetry/ITelemetryEnvironmentReader.js";
import { UpdateTelemetryConsentCommandHandler } from "./UpdateTelemetryConsentCommandHandler.js";
import { IUpdateTelemetryConsentGateway } from "./IUpdateTelemetryConsentGateway.js";
import { UpdateTelemetryConsentRequest } from "./UpdateTelemetryConsentRequest.js";
import { UpdateTelemetryConsentResponse } from "./UpdateTelemetryConsentResponse.js";

export class LocalUpdateTelemetryConsentGateway implements IUpdateTelemetryConsentGateway {
  constructor(
    private readonly updateTelemetryConsentCommandHandler: UpdateTelemetryConsentCommandHandler,
    private readonly telemetryEnvironmentReader: ITelemetryEnvironmentReader,
  ) {}

  async updateTelemetryConsent(
    request: UpdateTelemetryConsentRequest,
  ): Promise<UpdateTelemetryConsentResponse> {
    const result = await this.updateTelemetryConsentCommandHandler.execute({
      enabled: request.enabled,
    });

    const disabledByCi = this.telemetryEnvironmentReader.isCiEnvironment();
    const disabledByEnvironment =
      this.telemetryEnvironmentReader.isTelemetryDisabledByEnvironment();

    return {
      enabled: result.enabled,
      effectiveEnabled:
        result.enabled && !disabledByCi && !disabledByEnvironment,
      anonymousId: result.anonymousId,
      disabledByCi,
      disabledByEnvironment,
      generatedAnonymousId: result.generatedAnonymousId,
    };
  }
}
