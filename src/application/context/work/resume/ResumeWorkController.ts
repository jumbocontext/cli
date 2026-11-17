import { ResumeWorkRequest } from "./ResumeWorkRequest.js";
import { ResumeWorkResponse } from "./ResumeWorkResponse.js";
import { IResumeWorkGateway } from "./IResumeWorkGateway.js";

export class ResumeWorkController {
  constructor(private readonly gateway: IResumeWorkGateway) {}

  async handle(request: ResumeWorkRequest): Promise<ResumeWorkResponse> {
    return this.gateway.resumeWork(request);
  }
}
