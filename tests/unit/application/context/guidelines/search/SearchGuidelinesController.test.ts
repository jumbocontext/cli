import { describe, it, expect, jest } from "@jest/globals";
import { ISearchGuidelinesGateway } from "../../../../../../src/application/context/guidelines/search/ISearchGuidelinesGateway.js";
import { SearchGuidelinesController } from "../../../../../../src/application/context/guidelines/search/SearchGuidelinesController.js";
import { SearchGuidelinesRequest } from "../../../../../../src/application/context/guidelines/search/SearchGuidelinesRequest.js";
import { SearchGuidelinesResponse } from "../../../../../../src/application/context/guidelines/search/SearchGuidelinesResponse.js";

describe("SearchGuidelinesController", () => {
  it("should delegate to gateway with the request", async () => {
    const expectedResponse: SearchGuidelinesResponse = {
      guidelines: [
        {
          guidelineId: "guide_1",
          category: "testing",
          title: "Test behavior",
          description: "Cover important behavior",
          rationale: "Prevents regressions",
          examples: ["tests/example.test.ts"],
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    };

    const mockGateway: jest.Mocked<ISearchGuidelinesGateway> = {
      searchGuidelines: jest.fn<ISearchGuidelinesGateway["searchGuidelines"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new SearchGuidelinesController(mockGateway);
    const request: SearchGuidelinesRequest = { criteria: { category: "testing", title: "Test" } };

    const result = await controller.handle(request);

    expect(mockGateway.searchGuidelines).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through empty criteria", async () => {
    const mockGateway: jest.Mocked<ISearchGuidelinesGateway> = {
      searchGuidelines: jest.fn<ISearchGuidelinesGateway["searchGuidelines"]>().mockResolvedValue({ guidelines: [] }),
    };

    const controller = new SearchGuidelinesController(mockGateway);
    const request: SearchGuidelinesRequest = { criteria: {} };

    const result = await controller.handle(request);

    expect(mockGateway.searchGuidelines).toHaveBeenCalledWith(request);
    expect(result.guidelines).toEqual([]);
  });
});
