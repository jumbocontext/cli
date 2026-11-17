import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AvailableAgent } from "../../../../../../src/application/context/project/init/AgentSelection.js";
import { PlanProjectInitController } from "../../../../../../src/application/context/project/init/PlanProjectInitController.js";
import { IPlanProjectInitGateway } from "../../../../../../src/application/context/project/init/IPlanProjectInitGateway.js";
import { PlannedFileChange } from "../../../../../../src/application/context/project/init/PlannedFileChange.js";

describe("PlanProjectInitController", () => {
  let controller: PlanProjectInitController;
  let mockGateway: jest.Mocked<IPlanProjectInitGateway>;

  beforeEach(() => {
    mockGateway = {
      planProjectInit: jest.fn(),
    } as jest.Mocked<IPlanProjectInitGateway>;

    controller = new PlanProjectInitController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const availableAgents: AvailableAgent[] = [{ id: "claude", name: "Claude" }];
    const mockChanges: PlannedFileChange[] = [
      {
        path: "AGENTS.md",
        action: "create",
        description: "Agent configuration file",
      },
    ];

    const expectedResponse = { availableAgents, plannedChanges: mockChanges };
    mockGateway.planProjectInit.mockResolvedValue(expectedResponse);

    const response = await controller.handle({ projectRoot: "/test/project" });

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.planProjectInit).toHaveBeenCalledWith({ projectRoot: "/test/project" });
  });

  it("should pass project root through to gateway", async () => {
    mockGateway.planProjectInit.mockResolvedValue({ availableAgents: [], plannedChanges: [] });

    await controller.handle({ projectRoot: "/another/project" });

    expect(mockGateway.planProjectInit).toHaveBeenCalledWith({ projectRoot: "/another/project" });
  });
});
