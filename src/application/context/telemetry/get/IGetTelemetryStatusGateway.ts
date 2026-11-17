import { GetTelemetryStatusRequest } from "./GetTelemetryStatusRequest.js";
import { GetTelemetryStatusResponse } from "./GetTelemetryStatusResponse.js";

export interface IGetTelemetryStatusGateway {
  getTelemetryStatus(
    request: GetTelemetryStatusRequest,
  ): Promise<GetTelemetryStatusResponse>;
}
