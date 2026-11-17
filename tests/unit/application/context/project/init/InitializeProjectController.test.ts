import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { InitializeProjectController } from "../../../../../../src/application/context/project/init/InitializeProjectController.js";
import { IInitializeProjectGateway } from "../../../../../../src/application/context/project/init/IInitializeProjectGateway.js";
import { InitializeProjectRequest } from "../../../../../../src/application/context/project/init/InitializeProjectRequest.js";
import { InitializeProjectResponse } from "../../../../../../src/application/context/project/init/InitializeProjectResponse.js";

describe("InitializeProjectController", () => {
  let controller: InitializeProjectController;
  let mockGateway: jest.Mocked<IInitializeProjectGateway>;

  beforeEach(() => {
    mockGateway = {
      initializeProject: jest.fn(),
    } as jest.Mocked<IInitializeProjectGateway>;

    controller = new InitializeProjectController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: InitializeProjectRequest = {
      name: "my-project",
      purpose: "A test project",
      projectRoot: "/home/user/project",
      selectedAgentIds: ["claude"],
    };

    const expectedResponse: InitializeProjectResponse = {
      projectId: "project",
      changes: [
        { path: "AGENTS.md", action: "create", description: "Agent instructions" },
      ],
    };

    mockGateway.initializeProject.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.initializeProject).toHaveBeenCalledWith(request);
  });

  it("should pass request with undefined purpose to gateway", async () => {
    const request: InitializeProjectRequest = {
      name: "minimal-project",
      purpose: undefined,
      projectRoot: "/home/user/minimal",
      selectedAgentIds: undefined,
    };

    const expectedResponse: InitializeProjectResponse = {
      projectId: "project",
      changes: [],
    };

    mockGateway.initializeProject.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.initializeProject).toHaveBeenCalledWith(request);
  });
});
