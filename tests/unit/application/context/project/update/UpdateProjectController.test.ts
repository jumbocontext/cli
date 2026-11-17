import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateProjectController } from "../../../../../../src/application/context/project/update/UpdateProjectController.js";
import { IUpdateProjectGateway } from "../../../../../../src/application/context/project/update/IUpdateProjectGateway.js";

describe("UpdateProjectController", () => {
  let controller: UpdateProjectController;
  let mockGateway: jest.Mocked<IUpdateProjectGateway>;

  beforeEach(() => {
    mockGateway = {
      updateProject: jest.fn(),
    } as jest.Mocked<IUpdateProjectGateway>;

    controller = new UpdateProjectController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      purpose: "Updated purpose",
    };

    const expectedResponse = {
      updated: true,
      changedFields: ["purpose"],
      name: "my-project",
      purpose: "Updated purpose",
    };

    mockGateway.updateProject.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateProject).toHaveBeenCalledWith(request);
  });

  it("should handle request with no changes", async () => {
    const request = {
      purpose: "Same purpose",
    };

    const expectedResponse = {
      updated: false,
      changedFields: [],
      name: "my-project",
      purpose: "Same purpose",
    };

    mockGateway.updateProject.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateProject).toHaveBeenCalledWith(request);
  });
});
