import { GetGoalsRequest } from "./GetGoalsRequest.js";
import { GetGoalsResponse } from "./GetGoalsResponse.js";
import { IGetGoalsGateway } from "./IGetGoalsGateway.js";

export class GetGoalsController {
  constructor(private readonly gateway: IGetGoalsGateway) {}

  async handle(request: GetGoalsRequest): Promise<GetGoalsResponse> {
    return this.gateway.getGoals(request);
  }
}
