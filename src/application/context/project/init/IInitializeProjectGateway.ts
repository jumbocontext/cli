import { InitializeProjectRequest } from "./InitializeProjectRequest.js";
import { InitializeProjectResponse } from "./InitializeProjectResponse.js";

export interface IInitializeProjectGateway {
  initializeProject(
    request: InitializeProjectRequest,
  ): Promise<InitializeProjectResponse>;
}
