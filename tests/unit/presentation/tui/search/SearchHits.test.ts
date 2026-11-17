import { describe, expect, it } from "@jest/globals";
import { flattenSearchHits } from "../../../../../src/presentation/tui/search/SearchHits.js";
import type { SearchHitGroup } from "../../../../../src/application/context/search/SearchHitGroup.js";

describe("SearchHits", () => {
  it("flattens grouped hits in render order", () => {
    const groups: readonly SearchHitGroup[] = [
      {
        category: "component",
        hits: [
          {
            source: { type: "component", id: "component_1" },
            category: "component",
            title: "Component",
            summary: null,
            snippet: null,
            facets: {},
            score: 2,
          },
        ],
      },
      {
        category: "future-memory",
        hits: [
          {
            source: { type: "future-memory", id: "future_1" },
            category: "future-memory",
            title: "Future",
            summary: null,
            snippet: null,
            facets: {},
            score: 1,
          },
        ],
      },
    ];

    expect(flattenSearchHits(groups).map((hit) => hit.source.id)).toEqual([
      "component_1",
      "future_1",
    ]);
  });
});
