import { IPlanProjectInitGateway } from "./IPlanProjectInitGateway.js";
import { PlanProjectInitRequest } from "./PlanProjectInitRequest.js";
import { PlanProjectInitResponse } from "./PlanProjectInitResponse.js";
import { PlannedFileChange } from "./PlannedFileChange.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";
import { IGitignoreProtocol } from "./IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../settings/ISettingsInitializer.js";

export class LocalPlanProjectInitGateway implements IPlanProjectInitGateway {
  constructor(
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer,
    private readonly gitignoreProtocol: IGitignoreProtocol,
  ) {}

  async planProjectInit(
    request: PlanProjectInitRequest,
  ): Promise<PlanProjectInitResponse> {
    const changes: PlannedFileChange[] = [];
    const availableAgents = this.agentFileProtocol.getAvailableAgents();

    // Get agent file changes (AGENTS.md and all agent configurers)
    const agentChanges = await this.agentFileProtocol.getPlannedFileChanges(
      request.projectRoot,
      request.selectedAgentIds,
    );
    changes.push(...agentChanges);

    // Get settings file change (if needed)
    const settingsChange =
      await this.settingsInitializer.getPlannedFileChange();
    if (settingsChange) {
      changes.push(settingsChange);
    }

    // Get gitignore changes (if needed)
    const gitignoreChanges = await this.gitignoreProtocol.getPlannedFileChanges(
      request.projectRoot,
    );
    changes.push(...gitignoreChanges);

    return { availableAgents, plannedChanges: changes };
  }
}
