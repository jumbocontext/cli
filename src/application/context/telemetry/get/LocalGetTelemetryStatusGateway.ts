import { TelemetryConsentStatusResolver } from "../TelemetryConsentStatusResolver.js";
import { GetTelemetryStatusRequest } from "./GetTelemetryStatusRequest.js";
import { GetTelemetryStatusResponse } from "./GetTelemetryStatusResponse.js";
import { IGetTelemetryStatusGateway } from "./IGetTelemetryStatusGateway.js";
import { ITelemetryEnvironmentReader } from "../../../telemetry/ITelemetryEnvironmentReader.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";

export class LocalGetTelemetryStatusGateway implements IGetTelemetryStatusGateway {
  constructor(
    private readonly settingsReader: ISettingsReader,
    private readonly telemetryEnvironmentReader: ITelemetryEnvironmentReader,
    private readonly telemetryConsentStatusResolver: TelemetryConsentStatusResolver,
  ) {}

  async getTelemetryStatus(
    _request: GetTelemetryStatusRequest,
  ): Promise<GetTelemetryStatusResponse> {
    // Check configuration BEFORE read() — read() auto-creates the settings
    // file with defaults, which would cause hasTelemetryConfiguration() to
    // return true prematurely and prevent the init consent prompt from firing.
    const configured = await this.settingsReader.hasTelemetryConfiguration();
    const settings = await this.settingsReader.read();

    return this.telemetryConsentStatusResolver.resolve(settings, configured, {
      ciDetected: this.telemetryEnvironmentReader.isCiEnvironment(),
      environmentDisabled:
        this.telemetryEnvironmentReader.isTelemetryDisabledByEnvironment(),
    });
  }
}
