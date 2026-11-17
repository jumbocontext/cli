import { PlanProjectInitRequest } from "./PlanProjectInitRequest.js";
import { PlanProjectInitResponse } from "./PlanProjectInitResponse.js";
import { IPlanProjectInitGateway } from "./IPlanProjectInitGateway.js";

export class PlanProjectInitController {
  constructor(private readonly gateway: IPlanProjectInitGateway) {}

  async handle(
    request: PlanProjectInitRequest,
  ): Promise<PlanProjectInitResponse> {
    return this.gateway.planProjectInit(request);
  }
}
