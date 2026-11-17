import { IUpdateTelemetryConsentGateway } from "./IUpdateTelemetryConsentGateway.js";
import { UpdateTelemetryConsentRequest } from "./UpdateTelemetryConsentRequest.js";
import { UpdateTelemetryConsentResponse } from "./UpdateTelemetryConsentResponse.js";

export class UpdateTelemetryConsentController {
  constructor(private readonly gateway: IUpdateTelemetryConsentGateway) {}

  async handle(
    request: UpdateTelemetryConsentRequest,
  ): Promise<UpdateTelemetryConsentResponse> {
    return this.gateway.updateTelemetryConsent(request);
  }
}
