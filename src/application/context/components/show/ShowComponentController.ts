import { ShowComponentRequest } from "./ShowComponentRequest.js";
import { ShowComponentResponse } from "./ShowComponentResponse.js";
import { IShowComponentGateway } from "./IShowComponentGateway.js";

export class ShowComponentController {
  constructor(private readonly gateway: IShowComponentGateway) {}

  async handle(request: ShowComponentRequest): Promise<ShowComponentResponse> {
    return this.gateway.showComponent(request);
  }
}
