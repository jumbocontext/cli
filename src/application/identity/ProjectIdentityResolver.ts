import { ISettingsReader } from "../settings/ISettingsReader.js";
import { Settings } from "../settings/Settings.js";
import { IdGenerator } from "./IdGenerator.js";
import {
  IProjectIdentityResolver,
  ProjectHistoryProbe,
} from "./IProjectIdentityResolver.js";

export class ProjectIdentityResolver implements IProjectIdentityResolver {
  constructor(
    private readonly settingsReader: ISettingsReader,
    private readonly generateId: () => string = () => IdGenerator.generate(),
  ) {}

  generateProjectId(): string {
    return this.generateId();
  }

  async persistProjectId(projectId: string): Promise<void> {
    const settings = await this.settingsReader.read();
    await this.writeProjectId(settings, projectId);
  }

  async resolveExistingProjectId(
    projectedProjectId: string,
    hasProjectHistory?: ProjectHistoryProbe,
  ): Promise<string> {
    const settings = await this.settingsReader.read();
    const configuredProjectId = settings.project?.id;

    if (this.isConfiguredProjectId(configuredProjectId)) {
      if (
        !hasProjectHistory ||
        (await hasProjectHistory(configuredProjectId))
      ) {
        return configuredProjectId;
      }

      if (
        configuredProjectId !== projectedProjectId &&
        (await hasProjectHistory(projectedProjectId))
      ) {
        await this.writeProjectId(settings, projectedProjectId);
        return projectedProjectId;
      }

      return configuredProjectId;
    }

    await this.writeProjectId(settings, projectedProjectId);
    return projectedProjectId;
  }

  private async writeProjectId(
    settings: Settings,
    projectId: string,
  ): Promise<void> {
    await this.settingsReader.write({
      ...settings,
      project: {
        ...settings.project,
        id: projectId,
      },
    });
  }

  private isConfiguredProjectId(projectId: unknown): projectId is string {
    return typeof projectId === "string" && projectId.trim().length > 0;
  }
}
