import { IInitializeProjectGateway } from "./IInitializeProjectGateway.js";
import { InitializeProjectRequest } from "./InitializeProjectRequest.js";
import { InitializeProjectResponse } from "./InitializeProjectResponse.js";
import { InitializeProjectCommandHandler } from "./InitializeProjectCommandHandler.js";
import { IPlanProjectInitGateway } from "./IPlanProjectInitGateway.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";

export class LocalInitializeProjectGateway implements IInitializeProjectGateway {
  constructor(
    private readonly commandHandler: InitializeProjectCommandHandler,
    private readonly planProjectInitGateway: IPlanProjectInitGateway,
    private readonly agentFileProtocol: IAgentFileProtocol,
  ) {}

  async initializeProject(
    request: InitializeProjectRequest,
  ): Promise<InitializeProjectResponse> {
    const planResponse = await this.planProjectInitGateway.planProjectInit({
      projectRoot: request.projectRoot,
      selectedAgentIds: request.selectedAgentIds,
    });

    // Ensure JUMBO.md exists before ensureAgentsMd (called inside commandHandler.execute)
    await this.agentFileProtocol.ensureJumboMd(request.projectRoot);

    const result = await this.commandHandler.execute(
      { name: request.name, purpose: request.purpose },
      request.projectRoot,
      request.selectedAgentIds,
    );

    return {
      projectId: result.projectId,
      changes: planResponse.plannedChanges,
    };
  }
}
