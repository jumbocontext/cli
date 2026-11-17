import { IUpdateProjectGateway } from "./IUpdateProjectGateway.js";
import { UpdateProjectRequest } from "./UpdateProjectRequest.js";
import { UpdateProjectResponse } from "./UpdateProjectResponse.js";
import { UpdateProjectCommandHandler } from "./UpdateProjectCommandHandler.js";
import { IProjectUpdateReader } from "./IProjectUpdateReader.js";

export class LocalUpdateProjectGateway implements IUpdateProjectGateway {
  constructor(
    private readonly commandHandler: UpdateProjectCommandHandler,
    private readonly reader: IProjectUpdateReader,
  ) {}

  async updateProject(
    request: UpdateProjectRequest,
  ): Promise<UpdateProjectResponse> {
    const result = await this.commandHandler.execute({
      purpose: request.purpose,
    });

    const view = await this.reader.getProject();

    return {
      updated: result.updated,
      changedFields: result.changedFields,
      name: view?.name ?? "N/A",
      purpose: view?.purpose ?? null,
    };
  }
}
