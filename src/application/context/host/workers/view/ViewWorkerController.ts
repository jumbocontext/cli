import { ViewWorkerRequest } from "./ViewWorkerRequest.js";
import { ViewWorkerResponse } from "./ViewWorkerResponse.js";
import { IViewWorkerGateway } from "./IViewWorkerGateway.js";

export class ViewWorkerController {
  constructor(private readonly gateway: IViewWorkerGateway) {}

  async handle(request: ViewWorkerRequest): Promise<ViewWorkerResponse> {
    return this.gateway.viewWorker(request);
  }
}
