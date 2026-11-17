import { IInitializeProjectGateway } from "./IInitializeProjectGateway.js";
import { InitializeProjectRequest } from "./InitializeProjectRequest.js";
import { InitializeProjectResponse } from "./InitializeProjectResponse.js";

export class InitializeProjectController {
  constructor(private readonly gateway: IInitializeProjectGateway) {}

  async handle(
    request: InitializeProjectRequest,
  ): Promise<InitializeProjectResponse> {
    return this.gateway.initializeProject(request);
  }
}
