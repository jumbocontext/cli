import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateDependencyController } from "../../../../../../src/application/context/dependencies/update/UpdateDependencyController.js";
import { IUpdateDependencyGateway } from "../../../../../../src/application/context/dependencies/update/IUpdateDependencyGateway.js";
import { DependencyStatus } from "../../../../../../src/domain/dependencies/Constants.js";

describe("UpdateDependencyController", () => {
  let controller: UpdateDependencyController;
  let mockGateway: jest.Mocked<IUpdateDependencyGateway>;

  beforeEach(() => {
    mockGateway = {
      updateDependency: jest.fn(),
    } as jest.Mocked<IUpdateDependencyGateway>;

    controller = new UpdateDependencyController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      dependencyId: "dep_123",
      endpoint: "/api/v2/users",
    };

    const expectedResponse = {
      dependencyId: "dep_123",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/v2/users",
      contract: "IUserRepository",
      status: "active",
    };

    mockGateway.updateDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateDependency).toHaveBeenCalledWith(request);
  });

  it("should handle status-only update", async () => {
    const request = {
      dependencyId: "dep_456",
      status: DependencyStatus.DEPRECATED,
    };

    const expectedResponse = {
      dependencyId: "dep_456",
      consumerId: "AuthService",
      providerId: "LegacyDB",
      endpoint: "/api/auth",
      contract: "IAuthRepo",
      status: "deprecated",
    };

    mockGateway.updateDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateDependency).toHaveBeenCalledWith(request);
  });
});
