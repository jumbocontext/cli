import { describe, expect, it, jest } from "@jest/globals";
import { ISearchDependenciesGateway } from "../../../../../../src/application/context/dependencies/search/ISearchDependenciesGateway.js";
import { SearchDependenciesController } from "../../../../../../src/application/context/dependencies/search/SearchDependenciesController.js";
import { SearchDependenciesRequest } from "../../../../../../src/application/context/dependencies/search/SearchDependenciesRequest.js";
import { SearchDependenciesResponse } from "../../../../../../src/application/context/dependencies/search/SearchDependenciesResponse.js";

describe("SearchDependenciesController", () => {
  it("should delegate to gateway with the request", async () => {
    const expectedResponse: SearchDependenciesResponse = {
      dependencies: [
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
      ],
    };

    const mockGateway: jest.Mocked<ISearchDependenciesGateway> = {
      searchDependencies: jest.fn<ISearchDependenciesGateway["searchDependencies"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new SearchDependenciesController(mockGateway);
    const request: SearchDependenciesRequest = { criteria: { ecosystem: "npm", query: "server" } };

    const result = await controller.handle(request);

    expect(mockGateway.searchDependencies).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through empty criteria", async () => {
    const mockGateway: jest.Mocked<ISearchDependenciesGateway> = {
      searchDependencies: jest.fn<ISearchDependenciesGateway["searchDependencies"]>().mockResolvedValue({ dependencies: [] }),
    };

    const controller = new SearchDependenciesController(mockGateway);
    const request: SearchDependenciesRequest = { criteria: {} };

    const result = await controller.handle(request);

    expect(mockGateway.searchDependencies).toHaveBeenCalledWith(request);
    expect(result.dependencies).toEqual([]);
  });
});
