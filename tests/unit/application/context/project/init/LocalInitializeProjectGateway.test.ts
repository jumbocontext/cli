import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalInitializeProjectGateway } from "../../../../../../src/application/context/project/init/LocalInitializeProjectGateway.js";
import { InitializeProjectCommandHandler } from "../../../../../../src/application/context/project/init/InitializeProjectCommandHandler.js";
import { IPlanProjectInitGateway } from "../../../../../../src/application/context/project/init/IPlanProjectInitGateway.js";
import { IAgentFileProtocol } from "../../../../../../src/application/context/project/init/IAgentFileProtocol.js";
import { InitializeProjectRequest } from "../../../../../../src/application/context/project/init/InitializeProjectRequest.js";
import { PlannedFileChange } from "../../../../../../src/application/context/project/init/PlannedFileChange.js";

describe("LocalInitializeProjectGateway", () => {
  let gateway: LocalInitializeProjectGateway;
  let mockCommandHandler: jest.Mocked<InitializeProjectCommandHandler>;
  let mockPlanGateway: jest.Mocked<IPlanProjectInitGateway>;
  let mockAgentFileProtocol: jest.Mocked<IAgentFileProtocol>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<InitializeProjectCommandHandler>;

    mockPlanGateway = {
      planProjectInit: jest.fn(),
    } as jest.Mocked<IPlanProjectInitGateway>;

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

    gateway = new LocalInitializeProjectGateway(mockCommandHandler, mockPlanGateway, mockAgentFileProtocol);
  });

  it("should get planned changes, ensure JUMBO.md, execute command, and assemble response", async () => {
    const request: InitializeProjectRequest = {
      name: "my-project",
      purpose: "A test project",
      projectRoot: "/home/user/project",
      selectedAgentIds: ["claude"],
    };

    const plannedChanges: PlannedFileChange[] = [
      { path: "JUMBO.md", action: "create", description: "Jumbo instructions" },
      { path: "AGENTS.md", action: "create", description: "Agent instructions" },
      { path: ".claude/settings.json", action: "create", description: "CLI settings" },
    ];

    mockPlanGateway.planProjectInit.mockResolvedValue({
      availableAgents: [{ id: "claude", name: "Claude" }],
      plannedChanges,
    });

    mockCommandHandler.execute.mockResolvedValue({
      projectId: "project",
    });

    const response = await gateway.initializeProject(request);

    expect(response.projectId).toBe("project");
    expect(response.changes).toEqual(plannedChanges);
  });

  it("should call ensureJumboMd before commandHandler.execute", async () => {
    const request: InitializeProjectRequest = {
      name: "my-project",
      purpose: "A test project",
      projectRoot: "/home/user/project",
      selectedAgentIds: ["claude"],
    };

    const callOrder: string[] = [];
    mockPlanGateway.planProjectInit.mockResolvedValue({ availableAgents: [], plannedChanges: [] });
    mockAgentFileProtocol.ensureJumboMd.mockImplementation(async () => {
      callOrder.push("ensureJumboMd");
    });
    mockCommandHandler.execute.mockImplementation(async () => {
      callOrder.push("execute");
      return { projectId: "project" };
    });

    await gateway.initializeProject(request);

    expect(callOrder).toEqual(["ensureJumboMd", "execute"]);
    expect(mockAgentFileProtocol.ensureJumboMd).toHaveBeenCalledWith("/home/user/project");
  });

  it("should call planProjectInit with projectRoot from request", async () => {
    const request: InitializeProjectRequest = {
      name: "my-project",
      purpose: undefined,
      projectRoot: "/home/user/project",
      selectedAgentIds: ["antigravity"],
    };

    mockPlanGateway.planProjectInit.mockResolvedValue({ availableAgents: [], plannedChanges: [] });
    mockCommandHandler.execute.mockResolvedValue({ projectId: "project" });

    await gateway.initializeProject(request);

    expect(mockPlanGateway.planProjectInit).toHaveBeenCalledWith({
      projectRoot: "/home/user/project",
      selectedAgentIds: ["antigravity"],
    });
  });

  it("should build command from request and pass projectRoot to handler", async () => {
    const request: InitializeProjectRequest = {
      name: "my-project",
      purpose: "Build great things",
      projectRoot: "/home/user/project",
      selectedAgentIds: ["copilot"],
    };

    mockPlanGateway.planProjectInit.mockResolvedValue({ availableAgents: [], plannedChanges: [] });
    mockCommandHandler.execute.mockResolvedValue({ projectId: "project" });

    await gateway.initializeProject(request);

    expect(mockCommandHandler.execute).toHaveBeenCalledWith(
      { name: "my-project", purpose: "Build great things" },
      "/home/user/project",
      ["copilot"]
    );
  });

  it("should pass undefined purpose to command handler when not provided", async () => {
    const request: InitializeProjectRequest = {
      name: "minimal-project",
      purpose: undefined,
      projectRoot: "/home/user/minimal",
      selectedAgentIds: undefined,
    };

    mockPlanGateway.planProjectInit.mockResolvedValue({ availableAgents: [], plannedChanges: [] });
    mockCommandHandler.execute.mockResolvedValue({ projectId: "project" });

    await gateway.initializeProject(request);

    expect(mockCommandHandler.execute).toHaveBeenCalledWith(
      { name: "minimal-project", purpose: undefined },
      "/home/user/minimal",
      undefined
    );
  });
});
