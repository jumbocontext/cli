import { IUpdateDependencyGateway } from "./IUpdateDependencyGateway.js";
import { UpdateDependencyRequest } from "./UpdateDependencyRequest.js";
import { UpdateDependencyResponse } from "./UpdateDependencyResponse.js";
import { UpdateDependencyCommandHandler } from "./UpdateDependencyCommandHandler.js";
import { IDependencyUpdateReader } from "./IDependencyUpdateReader.js";

export class LocalUpdateDependencyGateway implements IUpdateDependencyGateway {
  constructor(
    private readonly commandHandler: UpdateDependencyCommandHandler,
    private readonly dependencyReader: IDependencyUpdateReader,
  ) {}

  async updateDependency(
    request: UpdateDependencyRequest,
  ): Promise<UpdateDependencyResponse> {
    const result = await this.commandHandler.execute({
      id: request.dependencyId,
      endpoint: request.endpoint,
      contract: request.contract,
      status: request.status,
    });

    const view = await this.dependencyReader.findById(result.dependencyId);

    const response: UpdateDependencyResponse = {
      dependencyId: result.dependencyId,
    };

    if (view) {
      return {
        ...response,
        name: view.name,
        ecosystem: view.ecosystem,
        packageName: view.packageName,
        versionConstraint: view.versionConstraint,
        endpoint: view.endpoint,
        contract: view.contract,
        status: view.status,
      };
    }

    return response;
  }
}
