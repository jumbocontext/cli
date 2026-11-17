import { InitializeProjectCommand } from "./InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "./IProjectInitializedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IProjectInitReader } from "./IProjectInitReader.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";
import { AgentId } from "./AgentSelection.js";
import { IGitignoreProtocol } from "./IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../settings/ISettingsInitializer.js";
import { IProjectIdentityResolver } from "../../../identity/IProjectIdentityResolver.js";
import { Project } from "../../../../domain/project/Project.js";
import { ProjectErrorMessages } from "../../../../domain/project/Constants.js";
import { ProjectNotInitializedError } from "../../../host/ProjectNotInitializedError.js";

export class InitializeProjectCommandHandler {
  constructor(
    private readonly eventWriter: IProjectInitializedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IProjectInitReader,
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer,
    private readonly gitignoreProtocol: IGitignoreProtocol,
    private readonly projectIdentityResolver: IProjectIdentityResolver,
  ) {}

  async execute(
    command: InitializeProjectCommand,
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[],
  ): Promise<{ projectId: string }> {
    const existingProject = await this.reader
      .getProject()
      .catch((error) => {
        if (error instanceof ProjectNotInitializedError) return null;
        throw error;
      });
    if (existingProject) {
      throw new Error(ProjectErrorMessages.ALREADY_INITIALIZED);
    }

    const project = Project.create();
    const projectId = project.snapshot.id;
    const event = project.initialize(command.name, command.purpose);

    await this.settingsInitializer.ensureSettingsFileExists();
    await this.projectIdentityResolver.persistProjectId(projectId);

    await this.eventWriter.append(event);

    await this.eventBus.publish(event);

    await this.agentFileProtocol.ensureAgentsMd(projectRoot);

    await this.agentFileProtocol.ensureAgentConfigurations(
      projectRoot,
      selectedAgentIds,
    );

    await this.gitignoreProtocol.ensureExclusions(projectRoot);

    return { projectId };
  }
}
