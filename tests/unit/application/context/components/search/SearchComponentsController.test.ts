import { describe, it, expect, jest } from "@jest/globals";
import { SearchComponentsController } from "../../../../../../src/application/context/components/search/SearchComponentsController.js";
import { ISearchComponentsGateway } from "../../../../../../src/application/context/components/search/ISearchComponentsGateway.js";
import { SearchComponentsRequest } from "../../../../../../src/application/context/components/search/SearchComponentsRequest.js";
import { SearchComponentsResponse } from "../../../../../../src/application/context/components/search/SearchComponentsResponse.js";

describe("SearchComponentsController", () => {
  it("should delegate to gateway with the request", async () => {
    const expectedResponse: SearchComponentsResponse = {
      components: [
        {
          componentId: "comp_1",
          name: "AuthService",
          type: "service",
          description: "Handles authentication",
          responsibility: "Auth",
          path: "src/auth",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    };

    const mockGateway: jest.Mocked<ISearchComponentsGateway> = {
      searchComponents: jest.fn<ISearchComponentsGateway["searchComponents"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new SearchComponentsController(mockGateway);
    const request: SearchComponentsRequest = { criteria: { name: "Auth" } };

    const result = await controller.handle(request);

    expect(mockGateway.searchComponents).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through empty criteria", async () => {
    const mockGateway: jest.Mocked<ISearchComponentsGateway> = {
      searchComponents: jest.fn<ISearchComponentsGateway["searchComponents"]>().mockResolvedValue({ components: [] }),
    };

    const controller = new SearchComponentsController(mockGateway);
    const request: SearchComponentsRequest = { criteria: {} };

    const result = await controller.handle(request);

    expect(mockGateway.searchComponents).toHaveBeenCalledWith(request);
    expect(result.components).toEqual([]);
  });
});
