import { PauseWorkRequest } from "./PauseWorkRequest.js";
import { PauseWorkResponse } from "./PauseWorkResponse.js";
import { IPauseWorkGateway } from "./IPauseWorkGateway.js";

export class PauseWorkController {
  constructor(private readonly gateway: IPauseWorkGateway) {}

  async handle(request: PauseWorkRequest): Promise<PauseWorkResponse> {
    return this.gateway.pauseWork(request);
  }
}
