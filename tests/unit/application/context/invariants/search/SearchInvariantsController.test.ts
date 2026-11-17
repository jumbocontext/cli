import { describe, it, expect, jest } from "@jest/globals";
import { ISearchInvariantsGateway } from "../../../../../../src/application/context/invariants/search/ISearchInvariantsGateway.js";
import { SearchInvariantsController } from "../../../../../../src/application/context/invariants/search/SearchInvariantsController.js";
import { SearchInvariantsRequest } from "../../../../../../src/application/context/invariants/search/SearchInvariantsRequest.js";
import { SearchInvariantsResponse } from "../../../../../../src/application/context/invariants/search/SearchInvariantsResponse.js";

describe("SearchInvariantsController", () => {
  it("should delegate to gateway with the request", async () => {
    const expectedResponse: SearchInvariantsResponse = {
      invariants: [
        {
          invariantId: "inv_1",
          title: "Clean Architecture",
          description: "Keep layer boundaries clear",
          rationale: "Reduces coupling",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    };

    const mockGateway: jest.Mocked<ISearchInvariantsGateway> = {
      searchInvariants: jest.fn<ISearchInvariantsGateway["searchInvariants"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new SearchInvariantsController(mockGateway);
    const request: SearchInvariantsRequest = { criteria: { title: "Clean" } };

    const result = await controller.handle(request);

    expect(mockGateway.searchInvariants).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through empty criteria", async () => {
    const mockGateway: jest.Mocked<ISearchInvariantsGateway> = {
      searchInvariants: jest.fn<ISearchInvariantsGateway["searchInvariants"]>().mockResolvedValue({ invariants: [] }),
    };

    const controller = new SearchInvariantsController(mockGateway);
    const request: SearchInvariantsRequest = { criteria: {} };

    const result = await controller.handle(request);

    expect(mockGateway.searchInvariants).toHaveBeenCalledWith(request);
    expect(result.invariants).toEqual([]);
  });
});
