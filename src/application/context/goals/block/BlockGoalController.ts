import { BlockGoalRequest } from "./BlockGoalRequest.js";
import { BlockGoalResponse } from "./BlockGoalResponse.js";
import { IBlockGoalGateway } from "./IBlockGoalGateway.js";

export class BlockGoalController {
  constructor(private readonly gateway: IBlockGoalGateway) {}

  async handle(request: BlockGoalRequest): Promise<BlockGoalResponse> {
    return this.gateway.blockGoal(request);
  }
}
