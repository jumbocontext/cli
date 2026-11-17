import { describe, expect, it, jest } from "@jest/globals";
import { ISearchProvider } from "../../../../../src/application/context/search/ISearchProvider.js";
import { LocalSearchGateway } from "../../../../../src/application/context/search/LocalSearchGateway.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SearchHit } from "../../../../../src/application/context/search/SearchHit.js";

describe("LocalSearchGateway", () => {
  it("aggregates lean hits from search providers by score", async () => {
    const lowerScoreHit = createHit({
      category: SearchCategory.COMPONENT,
      id: "comp-1",
      title: "Component",
      score: 10,
    });
    const higherScoreHit = createHit({
      category: SearchCategory.DECISION,
      id: "dec-1",
      title: "Decision",
      score: 30,
    });
    const firstProvider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue([lowerScoreHit]),
    };
    const secondProvider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue([higherScoreHit]),
    };

    const gateway = new LocalSearchGateway([firstProvider, secondProvider]);
    const response = await gateway.search({ criteria: { query: "search" } });

    expect(firstProvider.search).toHaveBeenCalledWith({ query: "search" });
    expect(secondProvider.search).toHaveBeenCalledWith({ query: "search" });
    expect(response).toEqual({ hits: [higherScoreHit, lowerScoreHit] });
  });

  it("filters aggregated hits by category", async () => {
    const componentHit = createHit({
      category: SearchCategory.COMPONENT,
      id: "comp-1",
      title: "Component",
      score: 10,
    });
    const decisionHit = createHit({
      category: SearchCategory.DECISION,
      id: "dec-1",
      title: "Decision",
      score: 20,
    });
    const provider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue([componentHit, decisionHit]),
    };

    const gateway = new LocalSearchGateway([provider]);
    const response = await gateway.search({ criteria: { category: SearchCategory.DECISION } });

    expect(response).toEqual({ hits: [decisionHit] });
  });

  it("returns empty hits and groups when providers have no matches", async () => {
    const provider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchGateway([provider]);
    const response = await gateway.search({ criteria: { query: "missing", groupByCategory: true } });

    expect(response).toEqual({ hits: [], groups: [] });
  });

  it("propagates provider errors", async () => {
    const error = new Error("search index unavailable");
    const provider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockRejectedValue(error),
    };

    const gateway = new LocalSearchGateway([provider]);

    await expect(gateway.search({ criteria: { query: "search" } })).rejects.toThrow(error);
  });

  it("limits aggregated hits", async () => {
    const hits: SearchHit[] = [
      {
        source: { type: SearchCategory.COMPONENT, id: "comp-1" },
        category: SearchCategory.COMPONENT,
        title: "SearchIndex",
        summary: "Projected search",
        snippet: "Projected search",
        facets: { status: "active" },
        score: 30,
      },
      createHit({ category: SearchCategory.DECISION, id: "dec-1", title: "Decision", score: 20 }),
    ];
    const provider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue(hits),
    };

    const gateway = new LocalSearchGateway([provider]);
    const response = await gateway.search({ criteria: { query: "search", limit: 1 } });

    expect(response).toEqual({ hits: [hits[0]] });
  });

  it("groups hits by category when requested", async () => {
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
      {
        source: { type: SearchCategory.DECISION, id: "dec-1" },
        category: SearchCategory.DECISION,
        title: "Decision",
        summary: null,
        snippet: null,
        facets: {},
        score: 10,
      },
    ];
    const provider: jest.Mocked<ISearchProvider> = {
      search: jest.fn<ISearchProvider["search"]>().mockResolvedValue(hits),
    };

    const gateway = new LocalSearchGateway([provider]);
    const response = await gateway.search({ criteria: { groupByCategory: true } });

    expect(response.groups).toEqual([
      { category: SearchCategory.COMPONENT, hits: [hits[0]] },
      { category: SearchCategory.DECISION, hits: [hits[1]] },
    ]);
  });
});

function createHit(input: {
  readonly category: SearchCategory;
  readonly id: string;
  readonly title: string;
  readonly score: number;
}): SearchHit {
  return {
    source: { type: input.category, id: input.id },
    category: input.category,
    title: input.title,
    summary: null,
    snippet: null,
    facets: {},
    score: input.score,
  };
}
