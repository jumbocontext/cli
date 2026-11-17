import { GetTelemetryStatusRequest } from "./GetTelemetryStatusRequest.js";
import { GetTelemetryStatusResponse } from "./GetTelemetryStatusResponse.js";
import { IGetTelemetryStatusGateway } from "./IGetTelemetryStatusGateway.js";

export class GetTelemetryStatusController {
  constructor(private readonly gateway: IGetTelemetryStatusGateway) {}

  async handle(
    request: GetTelemetryStatusRequest,
  ): Promise<GetTelemetryStatusResponse> {
    return this.gateway.getTelemetryStatus(request);
  }
}
