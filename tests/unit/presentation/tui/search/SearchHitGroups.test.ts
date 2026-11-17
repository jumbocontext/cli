import { describe, expect, it } from "@jest/globals";
import { resolveSearchHitGroups } from "../../../../../src/presentation/tui/search/SearchHitGroups.js";
import type { SearchResponse } from "../../../../../src/application/context/search/SearchResponse.js";

describe("SearchHitGroups", () => {
  it("uses response groups when the shared search contract provides them", () => {
    const response: SearchResponse = {
      hits: [],
      groups: [{ category: "future-memory", hits: [] }],
    };

    expect(resolveSearchHitGroups(response)).toEqual(response.groups);
  });

  it("groups generic hits by category without assuming known entity types", () => {
    const response: SearchResponse = {
      hits: [
        {
          source: { type: "future-memory", id: "future_1" },
          category: "future-memory",
          title: "Future",
          summary: null,
          snippet: null,
          facets: {},
          score: 4,
        },
        {
          source: { type: "component", id: "component_1" },
          category: "component",
          title: "Component",
          summary: null,
          snippet: null,
          facets: {},
          score: 3,
        },
      ],
    };

    expect(resolveSearchHitGroups(response).map((group) => group.category)).toEqual([
      "future-memory",
      "component",
    ]);
  });
});
