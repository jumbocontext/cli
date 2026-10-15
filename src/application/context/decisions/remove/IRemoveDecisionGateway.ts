import type { RemoveDecisionRequest } from "./RemoveDecisionRequest.js";
import type { RemoveDecisionResponse } from "./RemoveDecisionResponse.js";

export interface IRemoveDecisionGateway {
  removeDecision(request: RemoveDecisionRequest): Promise<RemoveDecisionResponse>;
}
