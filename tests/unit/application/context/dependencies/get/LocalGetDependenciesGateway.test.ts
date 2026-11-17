import { describe, it, expect, jest } from "@jest/globals";
import { LocalGetDependenciesGateway } from "../../../../../../src/application/context/dependencies/get/LocalGetDependenciesGateway.js";
import { IDependencyViewReader } from "../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";

describe("LocalGetDependenciesGateway", () => {
  it("should delegate to dependency view reader with filter", async () => {
    const mockReader: jest.Mocked<IDependencyViewReader> = {
      findAll: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn(),
      search: jest.fn(),
    };

    const gateway = new LocalGetDependenciesGateway(mockReader);
    const filter = { consumer: "comp_1" };

    const result = await gateway.getDependencies({ filter });

    expect(mockReader.findAll).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ dependencies: [] });
  });

  it("should pass undefined filter when not provided", async () => {
    const mockReader: jest.Mocked<IDependencyViewReader> = {
      findAll: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn(),
      search: jest.fn(),
    };

    const gateway = new LocalGetDependenciesGateway(mockReader);

    await gateway.getDependencies({});

    expect(mockReader.findAll).toHaveBeenCalledWith(undefined);
  });

  it("should return dependencies from reader", async () => {
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

    const mockReader: jest.Mocked<IDependencyViewReader> = {
      findAll: jest.fn().mockResolvedValue(mockDependencies),
      findByIds: jest.fn(),
      search: jest.fn(),
    };

    const gateway = new LocalGetDependenciesGateway(mockReader);
    const result = await gateway.getDependencies({});

    expect(result.dependencies).toEqual(mockDependencies);
  });
});
