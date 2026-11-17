import { IPauseWorkGateway } from "./IPauseWorkGateway.js";
import { PauseWorkRequest } from "./PauseWorkRequest.js";
import { PauseWorkResponse } from "./PauseWorkResponse.js";
import { PauseWorkCommandHandler } from "./PauseWorkCommandHandler.js";

export class LocalPauseWorkGateway implements IPauseWorkGateway {
  constructor(private readonly commandHandler: PauseWorkCommandHandler) {}

  async pauseWork(_request: PauseWorkRequest): Promise<PauseWorkResponse> {
    const result = await this.commandHandler.execute({});
    return {
      goalId: result.goalId,
      objective: result.objective,
    };
  }
}
