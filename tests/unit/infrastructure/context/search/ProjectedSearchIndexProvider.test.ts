import { describe, expect, it, jest } from "@jest/globals";
import { ISearchIndexReader } from "../../../../../src/application/context/search/ISearchIndexReader.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SearchHit } from "../../../../../src/application/context/search/SearchHit.js";
import { ProjectedSearchIndexProvider } from "../../../../../src/infrastructure/context/search/ProjectedSearchIndexProvider.js";

describe("ProjectedSearchIndexProvider", () => {
  it("delegates search criteria to the projected search index reader", async () => {
    const hits: SearchHit[] = [
      {
        source: { type: SearchCategory.COMPONENT, id: "comp-1" },
        category: SearchCategory.COMPONENT,
        title: "Component",
        summary: null,
        snippet: null,
        facets: {},
        score: 10,
      },
    ];
    const reader: jest.Mocked<ISearchIndexReader> = {
      findBySource: jest.fn(),
      search: jest.fn<ISearchIndexReader["search"]>().mockResolvedValue(hits),
    };

    const provider = new ProjectedSearchIndexProvider(reader);
    const result = await provider.search({ query: "component", category: SearchCategory.COMPONENT });

    expect(reader.search).toHaveBeenCalledWith({ query: "component", category: SearchCategory.COMPONENT });
    expect(result).toBe(hits);
  });
});
