import { IViewWorkerGateway } from "./IViewWorkerGateway.js";
import { ViewWorkerRequest } from "./ViewWorkerRequest.js";
import { ViewWorkerResponse } from "./ViewWorkerResponse.js";
import { IWorkerIdentityReader } from "../../../../host/workers/IWorkerIdentityReader.js";
import { ISettingsReader } from "../../../../settings/ISettingsReader.js";

export class LocalViewWorkerGateway implements IViewWorkerGateway {
  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly settingsReader: ISettingsReader,
  ) {}

  async viewWorker(_request: ViewWorkerRequest): Promise<ViewWorkerResponse> {
    const workerId = this.workerIdentityReader.workerId;
    const settings = await this.settingsReader.read();
    return {
      workerId,
      claimDurationMinutes: settings.claims.claimDurationMinutes,
    };
  }
}
