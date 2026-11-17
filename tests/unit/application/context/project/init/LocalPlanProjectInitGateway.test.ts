import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AvailableAgent } from "../../../../../../src/application/context/project/init/AgentSelection.js";
import { LocalPlanProjectInitGateway } from "../../../../../../src/application/context/project/init/LocalPlanProjectInitGateway.js";
import { IAgentFileProtocol } from "../../../../../../src/application/context/project/init/IAgentFileProtocol.js";
import { IGitignoreProtocol } from "../../../../../../src/application/context/project/init/IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../../../../src/application/settings/ISettingsInitializer.js";
import { PlannedFileChange } from "../../../../../../src/application/context/project/init/PlannedFileChange.js";

describe("LocalPlanProjectInitGateway", () => {
  let gateway: LocalPlanProjectInitGateway;
  let mockAgentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let mockSettingsInitializer: jest.Mocked<ISettingsInitializer>;
  let mockGitignoreProtocol: jest.Mocked<IGitignoreProtocol>;

  beforeEach(() => {
    mockAgentFileProtocol = {
      ensureJumboMd: jest.fn<IAgentFileProtocol["ensureJumboMd"]>().mockResolvedValue(undefined),
      ensureAgentsMd: jest.fn<IAgentFileProtocol["ensureAgentsMd"]>().mockResolvedValue(undefined),
      ensureAgentConfigurations: jest.fn<IAgentFileProtocol["ensureAgentConfigurations"]>().mockResolvedValue(undefined),
      repairJumboMd: jest.fn<IAgentFileProtocol["repairJumboMd"]>().mockResolvedValue(undefined),
      repairAgentsMd: jest.fn<IAgentFileProtocol["repairAgentsMd"]>().mockResolvedValue(undefined),
      repairAgentConfigurations: jest.fn<IAgentFileProtocol["repairAgentConfigurations"]>().mockResolvedValue(undefined),
      getAvailableAgents: jest.fn<IAgentFileProtocol["getAvailableAgents"]>().mockReturnValue([]),
      getPlannedFileChanges: jest.fn<IAgentFileProtocol["getPlannedFileChanges"]>().mockResolvedValue([]),
    } as jest.Mocked<IAgentFileProtocol>;

    mockSettingsInitializer = {
      ensureSettingsFileExists: jest.fn<ISettingsInitializer["ensureSettingsFileExists"]>().mockResolvedValue(undefined),
      getPlannedFileChange: jest.fn<ISettingsInitializer["getPlannedFileChange"]>().mockResolvedValue(null),
    } as jest.Mocked<ISettingsInitializer>;

    mockGitignoreProtocol = {
      ensureExclusions: jest.fn<IGitignoreProtocol["ensureExclusions"]>().mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn<IGitignoreProtocol["getPlannedFileChanges"]>().mockResolvedValue([]),
    } as jest.Mocked<IGitignoreProtocol>;

    gateway = new LocalPlanProjectInitGateway(mockAgentFileProtocol, mockSettingsInitializer, mockGitignoreProtocol);
  });

  it("should aggregate agent file changes, settings change, and gitignore changes into response", async () => {
    const availableAgents: AvailableAgent[] = [{ id: "claude", name: "Claude" }];
    const agentChanges: PlannedFileChange[] = [
      { path: "JUMBO.md", action: "create", description: "Jumbo instructions file" },
      { path: "AGENTS.md", action: "create", description: "Agent instructions file" },
      { path: ".claude/settings.json", action: "create", description: "Claude agent config" },
    ];
    const settingsChange: PlannedFileChange = {
      path: ".jumbo/settings.jsonc",
      action: "create",
      description: "Jumbo settings file",
    };
    const gitignoreChanges: PlannedFileChange[] = [
      { path: ".gitignore", action: "create", description: "Exclude Jumbo internal state from version control" },
    ];

    mockAgentFileProtocol.getAvailableAgents.mockReturnValue(availableAgents);
    mockAgentFileProtocol.getPlannedFileChanges.mockResolvedValue(agentChanges);
    mockSettingsInitializer.getPlannedFileChange.mockResolvedValue(settingsChange);
    mockGitignoreProtocol.getPlannedFileChanges.mockResolvedValue(gitignoreChanges);

    const response = await gateway.planProjectInit({ projectRoot: "/test/project" });

    expect(response).toEqual({
      availableAgents,
      plannedChanges: [...agentChanges, settingsChange, ...gitignoreChanges],
    });
    expect(mockAgentFileProtocol.getPlannedFileChanges).toHaveBeenCalledWith("/test/project", undefined);
    expect(mockSettingsInitializer.getPlannedFileChange).toHaveBeenCalled();
    expect(mockGitignoreProtocol.getPlannedFileChanges).toHaveBeenCalledWith("/test/project");
  });

  it("should exclude settings change when settingsInitializer returns null", async () => {
    const agentChanges: PlannedFileChange[] = [
      { path: "AGENTS.md", action: "modify", description: "Agent instructions file" },
    ];

    mockAgentFileProtocol.getPlannedFileChanges.mockResolvedValue(agentChanges);
    mockSettingsInitializer.getPlannedFileChange.mockResolvedValue(null);
    mockGitignoreProtocol.getPlannedFileChanges.mockResolvedValue([]);

    const response = await gateway.planProjectInit({ projectRoot: "/test/project" });

    expect(response).toEqual({ availableAgents: [], plannedChanges: agentChanges });
  });

  it("should return empty planned changes when no changes are needed", async () => {
    mockAgentFileProtocol.getPlannedFileChanges.mockResolvedValue([]);
    mockSettingsInitializer.getPlannedFileChange.mockResolvedValue(null);
    mockGitignoreProtocol.getPlannedFileChanges.mockResolvedValue([]);

    const response = await gateway.planProjectInit({ projectRoot: "/test/project" });

    expect(response).toEqual({ availableAgents: [], plannedChanges: [] });
  });

  it("should pass selected agent ids to the agent file protocol", async () => {
    await gateway.planProjectInit({
      projectRoot: "/test/project",
      selectedAgentIds: ["antigravity", "copilot"],
    });

    expect(mockAgentFileProtocol.getPlannedFileChanges).toHaveBeenCalledWith(
      "/test/project",
      ["antigravity", "copilot"]
    );
  });
});
