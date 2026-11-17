import { GetInvariantRequest } from "./GetInvariantRequest.js";
import { GetInvariantResponse } from "./GetInvariantResponse.js";
import { GetInvariantsRequest } from "./GetInvariantsRequest.js";
import { GetInvariantsResponse } from "./GetInvariantsResponse.js";
import { GetAllInvariantsRequest } from "./GetAllInvariantsRequest.js";
import { GetAllInvariantsResponse } from "./GetAllInvariantsResponse.js";

export interface IGetInvariantsGateway {
  getInvariant(request: GetInvariantRequest): Promise<GetInvariantResponse>;
  getInvariants(request: GetInvariantsRequest): Promise<GetInvariantsResponse>;
  getAllInvariants(
    request: GetAllInvariantsRequest,
  ): Promise<GetAllInvariantsResponse>;
}
