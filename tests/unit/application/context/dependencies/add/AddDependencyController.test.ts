import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddDependencyController } from "../../../../../../src/application/context/dependencies/add/AddDependencyController.js";
import { IAddDependencyGateway } from "../../../../../../src/application/context/dependencies/add/IAddDependencyGateway.js";

describe("AddDependencyController", () => {
  let controller: AddDependencyController;
  let mockGateway: jest.Mocked<IAddDependencyGateway>;

  beforeEach(() => {
    mockGateway = {
      addDependency: jest.fn(),
    } as jest.Mocked<IAddDependencyGateway>;

    controller = new AddDependencyController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/users",
      contract: "IUserRepository",
    };

    const expectedResponse = {
      dependencyId: "dep_npm_express",
    };

    mockGateway.addDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDependency).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      name: "Axios",
      ecosystem: "npm",
      packageName: "axios",
    };

    const expectedResponse = {
      dependencyId: "dep_npm_axios",
    };

    mockGateway.addDependency.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDependency).toHaveBeenCalledWith(request);
  });
});
