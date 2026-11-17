import { describe, expect, it, jest } from "@jest/globals";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView.js";
import { IDependencyViewReader } from "../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { LocalSearchDependenciesGateway } from "../../../../../../src/application/context/dependencies/search/LocalSearchDependenciesGateway.js";

describe("LocalSearchDependenciesGateway", () => {
  it("should delegate to dependencyViewReader.search with criteria", async () => {
    const expectedDependencies: DependencyView[] = [
      {
        dependencyId: "dep_1",
        name: "Express",
        ecosystem: "npm",
        packageName: "express",
        versionConstraint: "^4.18.0",
        endpoint: null,
        contract: "HTTP server",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        removedAt: null,
        removalReason: null,
      },
    ];

    const mockReader: jest.Mocked<IDependencyViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDependencyViewReader["search"]>().mockResolvedValue(expectedDependencies),
    };

    const gateway = new LocalSearchDependenciesGateway(mockReader);
    const result = await gateway.searchDependencies({ criteria: { packageName: "exp*" } });

    expect(mockReader.search).toHaveBeenCalledWith({ packageName: "exp*" });
    expect(result.dependencies).toEqual(expectedDependencies);
  });

  it("should return empty dependencies when search finds no matches", async () => {
    const mockReader: jest.Mocked<IDependencyViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDependencyViewReader["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchDependenciesGateway(mockReader);
    const result = await gateway.searchDependencies({ criteria: { query: "nonexistent" } });

    expect(result.dependencies).toEqual([]);
  });
});
