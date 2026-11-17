import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { SearchResultDetail } from "../../../../../src/presentation/tui/search/SearchResultDetail.js";

describe("SearchResultDetail", () => {
  it("renders generic source identity and facets for the focused hit", () => {
    const { lastFrame, unmount } = render(
      <SearchResultDetail
        width={80}
        hit={{
          source: { type: "future-memory", id: "future_1" },
          category: "future-memory",
          title: "Future Memory",
          summary: "Generic hit detail",
          snippet: "Matched query text",
          facets: { tags: ["alpha", "beta"], active: true },
          score: 8,
        }}
      />,
    );
    const frame = lastFrame() ?? "";

    expect(frame).toContain("future-memory:future_1");
    expect(frame).toContain("Future Memory");
    expect(frame).toContain("Generic hit detail");
    expect(frame).toContain("alpha, beta");
    unmount();
  });
});
