import { describe, expect, it } from "@jest/globals";
import { SearchCategory } from "../../../../../../../src/application/context/search/SearchCategory.js";
import { IndexRebuildOutputBuilder } from "../../../../../../../src/presentation/cli/commands/index/rebuild/IndexRebuildOutputBuilder.js";

describe("IndexRebuildOutputBuilder", () => {
  it("renders text and structured success output", () => {
    const builder = new IndexRebuildOutputBuilder();
    const response = {
      success: true,
      eventsInspected: 5,
      documentsIndexed: 2,
      removedEntries: 1,
      countsByCategory: {
        [SearchCategory.COMPONENT]: 1,
        [SearchCategory.INVARIANT]: 1,
      },
    };

    const output = builder.buildSuccess(response);
    const text = output.toHumanReadable();

    expect(text).toContain("Search Index Rebuild");
    expect(text).toContain("Events inspected");
    expect(text).toContain("Documents indexed");
    expect(builder.buildStructuredOutput(response)).toEqual({
      success: true,
      eventsInspected: 5,
      documentsIndexed: 2,
      removedEntries: 1,
      countsByCategory: {
        [SearchCategory.COMPONENT]: 1,
        [SearchCategory.INVARIANT]: 1,
      },
    });
  });

  it("renders failure output through the builder", () => {
    const builder = new IndexRebuildOutputBuilder();
    const output = builder.buildFailure(new Error("sqlite unavailable"));

    expect(output.toHumanReadable()).toContain("Search index rebuild failed");
    expect(builder.buildFailureData(new Error("sqlite unavailable"))).toEqual({
      success: false,
      error: "Search index rebuild failed",
      details: "sqlite unavailable",
    });
  });
});
