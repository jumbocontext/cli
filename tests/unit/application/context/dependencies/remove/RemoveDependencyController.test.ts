import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RemoveDependencyController } from "../../../../../../src/application/context/dependencies/remove/RemoveDependencyController.js";
import { IRemoveDependencyGateway } from "../../../../../../src/application/context/dependencies/remove/IRemoveDependencyGateway.js";

describe("RemoveDependencyController", () => {
  let controller: RemoveDependencyController;
  let mockGateway: jest.Mocked<IRemoveDependencyGateway>;

  beforeEach(() => {
    mockGateway = {
      removeDependency: jest.fn(),
    } as jest.Mocked<IRemoveDependencyGateway>;

    controller = new RemoveDependencyController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      dependencyId: "dep_123",
      reason: "No longer needed",
    };

    const expectedResponse = {
      dependencyId: "dep_123",
      consumer: "UserService",
      provider: "DatabaseClient",
      status: "removed",
      reason: "No longer needed",
    };

    mockGateway.removeDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeDependency).toHaveBeenCalledWith(request);
  });
});
