import type { IProjectStatsGateway } from "./IProjectStatsGateway.js";
import type { ProjectStatsRequest } from "./ProjectStatsRequest.js";
import type { ProjectStatsResponse } from "./ProjectStatsResponse.js";

export class ProjectStatsController {
  constructor(private readonly gateway: IProjectStatsGateway) {}

  async handle(
    request: ProjectStatsRequest = {},
  ): Promise<ProjectStatsResponse> {
    return this.gateway.getProjectStats(request);
  }
}
