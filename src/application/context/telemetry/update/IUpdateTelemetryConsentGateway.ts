import { UpdateTelemetryConsentRequest } from "./UpdateTelemetryConsentRequest.js";
import { UpdateTelemetryConsentResponse } from "./UpdateTelemetryConsentResponse.js";

export interface IUpdateTelemetryConsentGateway {
  updateTelemetryConsent(
    request: UpdateTelemetryConsentRequest,
  ): Promise<UpdateTelemetryConsentResponse>;
}
