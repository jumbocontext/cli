import { PlanProjectInitRequest } from "./PlanProjectInitRequest.js";
import { PlanProjectInitResponse } from "./PlanProjectInitResponse.js";

export interface IPlanProjectInitGateway {
  planProjectInit(
    request: PlanProjectInitRequest,
  ): Promise<PlanProjectInitResponse>;
}
