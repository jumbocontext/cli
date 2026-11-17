import { UpdateProjectRequest } from "./UpdateProjectRequest.js";
import { UpdateProjectResponse } from "./UpdateProjectResponse.js";
import { IUpdateProjectGateway } from "./IUpdateProjectGateway.js";

export class UpdateProjectController {
  constructor(private readonly gateway: IUpdateProjectGateway) {}

  async handle(request: UpdateProjectRequest): Promise<UpdateProjectResponse> {
    return this.gateway.updateProject(request);
  }
}
