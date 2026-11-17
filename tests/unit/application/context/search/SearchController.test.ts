import { describe, expect, it, jest } from "@jest/globals";
import { ISearchGateway } from "../../../../../src/application/context/search/ISearchGateway.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SearchController } from "../../../../../src/application/context/search/SearchController.js";
import { SearchResponse } from "../../../../../src/application/context/search/SearchResponse.js";

describe("SearchController", () => {
  it("passes document-agnostic search requests to the gateway", async () => {
    const response: SearchResponse = {
      hits: [
        {
          source: { type: SearchCategory.COMPONENT, id: "comp-1" },
          category: SearchCategory.COMPONENT,
          title: "Search",
          summary: null,
          snippet: null,
          facets: {},
          score: 30,
        },
      ],
    };
    const gateway: jest.Mocked<ISearchGateway> = {
      search: jest.fn<ISearchGateway["search"]>().mockResolvedValue(response),
    };
    const request = { criteria: { query: "search", category: SearchCategory.COMPONENT } };

    const controller = new SearchController(gateway);
    const result = await controller.handle(request);

    expect(gateway.search).toHaveBeenCalledWith(request);
    expect(result).toBe(response);
  });
});
