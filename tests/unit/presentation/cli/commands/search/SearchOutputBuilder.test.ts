import { describe, expect, it, beforeEach } from "@jest/globals";
import { SearchCategory } from "../../../../../../src/application/context/search/SearchCategory.js";
import { SearchHit } from "../../../../../../src/application/context/search/SearchHit.js";
import { SearchOutputBuilder } from "../../../../../../src/presentation/cli/commands/search/SearchOutputBuilder.js";

describe("SearchOutputBuilder", () => {
  let outputBuilder: SearchOutputBuilder;

  const hits: SearchHit[] = [
    {
      source: { type: SearchCategory.COMPONENT, id: "comp_1" },
      category: SearchCategory.COMPONENT,
      title: "SearchOutputBuilder",
      summary: "Renders global search hits.",
      snippet: "Search hits are grouped by category.",
      facets: { status: "active", tags: ["cli", "search"] },
      score: 42,
    },
    {
      source: { type: SearchCategory.DECISION, id: "dec_1" },
      category: SearchCategory.DECISION,
      title: "Use document-agnostic search results",
      summary: "Search responses use generic hits.",
      snippet: null,
      facets: { superseded: false },
      score: 30,
    },
  ];

  beforeEach(() => {
    outputBuilder = new SearchOutputBuilder();
  });

  it("renders grouped generic hits in text mode", () => {
    const output = outputBuilder.build(
      { hits, groups: [{ category: SearchCategory.COMPONENT, hits: [hits[0]] }, { category: SearchCategory.DECISION, hits: [hits[1]] }] },
      { query: "search" },
      "default"
    );
    const text = output.toHumanReadable();

    expect(text).toContain("Search Results (2)");
    expect(text).toContain("Component (1)");
    expect(text).toContain("Decision (1)");
    expect(text).toContain("SearchOutputBuilder");
    expect(text).toContain("component:comp_1");
    expect(text).toContain("status: active");
  });

  it("builds groups from hits when the response has no groups", () => {
    const output = outputBuilder.build({ hits }, { query: "search" }, "compact");
    const text = output.toHumanReadable();

    expect(text).toContain("Component (1)");
    expect(text).toContain("Decision (1)");
    expect(text).toContain("comp_1");
    expect(text).not.toContain("Renders global search hits.");
  });

  it("renders an empty result set", () => {
    const output = outputBuilder.build({ hits: [], groups: [] }, { query: "missing" }, "default");

    expect(output.toHumanReadable()).toContain('No memory search results matched "missing".');
  });

  it("emits one complete structured object for json output", () => {
    const output = outputBuilder.buildStructuredOutput(
      { hits, groups: [{ category: SearchCategory.COMPONENT, hits: [hits[0]] }, { category: SearchCategory.DECISION, hits: [hits[1]] }] },
      { query: "search", category: SearchCategory.COMPONENT, limit: 10 },
      "default"
    );
    const data = output.getSections().find((section) => section.type === "data")?.content as {
      query: string;
      category: string;
      limit: number;
      count: number;
      groups: Array<{ category: string; count: number; hits: Array<Record<string, unknown>> }>;
    };

    expect(data).toEqual({
      query: "search",
      category: SearchCategory.COMPONENT,
      limit: 10,
      count: 2,
      groups: [
        {
          category: SearchCategory.COMPONENT,
          count: 1,
          hits: [
            {
              source: { type: SearchCategory.COMPONENT, id: "comp_1" },
              category: SearchCategory.COMPONENT,
              title: "SearchOutputBuilder",
              summary: "Renders global search hits.",
              snippet: "Search hits are grouped by category.",
              facets: { status: "active", tags: ["cli", "search"] },
              score: 42,
            },
          ],
        },
        {
          category: SearchCategory.DECISION,
          count: 1,
          hits: [
            {
              source: { type: SearchCategory.DECISION, id: "dec_1" },
              category: SearchCategory.DECISION,
              title: "Use document-agnostic search results",
              summary: "Search responses use generic hits.",
              snippet: null,
              facets: { superseded: false },
              score: 30,
            },
          ],
        },
      ],
    });
  });

  it("omits summary, snippet, and facets in compact structured output", () => {
    const output = outputBuilder.buildStructuredOutput({ hits }, { query: "search" }, "compact");
    const data = output.getSections().find((section) => section.type === "data")?.content as {
      groups: Array<{ hits: Array<Record<string, unknown>> }>;
    };

    expect(data.groups[0].hits[0]).toEqual({
      source: { type: SearchCategory.COMPONENT, id: "comp_1" },
      category: SearchCategory.COMPONENT,
      title: "SearchOutputBuilder",
      score: 42,
    });
    expect(data.groups[0].hits[0]).not.toHaveProperty("summary");
    expect(data.groups[0].hits[0]).not.toHaveProperty("facets");
  });
});
