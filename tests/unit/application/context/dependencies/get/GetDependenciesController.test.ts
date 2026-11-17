import { describe, it, expect, jest } from "@jest/globals";
import { GetDependenciesController } from "../../../../../../src/application/context/dependencies/get/GetDependenciesController.js";
import { IGetDependenciesGateway } from "../../../../../../src/application/context/dependencies/get/IGetDependenciesGateway.js";

describe("GetDependenciesController", () => {
  it("should delegate to gateway with request", async () => {
    const mockGateway: jest.Mocked<IGetDependenciesGateway> = {
      getDependencies: jest.fn().mockResolvedValue({ dependencies: [] }),
    };

    const controller = new GetDependenciesController(mockGateway);
    const request = { filter: { consumer: "comp_1" } };

    const result = await controller.handle(request);

    expect(mockGateway.getDependencies).toHaveBeenCalledWith(request);
    expect(result).toEqual({ dependencies: [] });
  });

  it("should return dependencies from gateway", async () => {
    const mockDependencies = [
      {
        dependencyId: "dep_1",
        consumerId: "comp_a",
        providerId: "comp_b",
        endpoint: null,
        contract: null,
        status: "active" as const,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        removedAt: null,
        removalReason: null,
      },
    ];

    const mockGateway: jest.Mocked<IGetDependenciesGateway> = {
      getDependencies: jest.fn().mockResolvedValue({ dependencies: mockDependencies }),
    };

    const controller = new GetDependenciesController(mockGateway);
    const result = await controller.handle({});

    expect(result.dependencies).toEqual(mockDependencies);
  });
});
