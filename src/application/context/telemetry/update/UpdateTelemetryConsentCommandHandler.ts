import { randomUUID } from "crypto";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";
import { UpdateTelemetryConsentCommand } from "./UpdateTelemetryConsentCommand.js";

export interface UpdateTelemetryConsentCommandResult {
  enabled: boolean;
  anonymousId: string | null;
  generatedAnonymousId: boolean;
}

export class UpdateTelemetryConsentCommandHandler {
  constructor(private readonly settingsReader: ISettingsReader) {}

  async execute(
    command: UpdateTelemetryConsentCommand,
  ): Promise<UpdateTelemetryConsentCommandResult> {
    const settings = await this.settingsReader.read();

    let anonymousId = settings.telemetry.anonymousId;
    let generatedAnonymousId = false;

    if (command.enabled && anonymousId === null) {
      anonymousId = randomUUID();
      generatedAnonymousId = true;
    }

    await this.settingsReader.write({
      ...settings,
      telemetry: {
        enabled: command.enabled,
        anonymousId,
        consentGiven: true,
      },
    });

    return {
      enabled: command.enabled,
      anonymousId,
      generatedAnonymousId,
    };
  }
}
