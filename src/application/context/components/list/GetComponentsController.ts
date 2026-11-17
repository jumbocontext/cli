import { GetComponentsRequest } from "./GetComponentsRequest.js";
import { GetComponentsResponse } from "./GetComponentsResponse.js";
import { IGetComponentsGateway } from "./IGetComponentsGateway.js";

export class GetComponentsController {
  constructor(private readonly gateway: IGetComponentsGateway) {}

  async handle(request: GetComponentsRequest): Promise<GetComponentsResponse> {
    return this.gateway.getComponents(request);
  }
}
