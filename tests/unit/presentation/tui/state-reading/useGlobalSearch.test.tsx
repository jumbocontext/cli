import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text, useInput } from "ink";
import { render } from "ink-testing-library";
import { StateReaderProvider } from "../../../../../src/presentation/tui/state-reading/StateReader.js";
import { useGlobalSearch } from "../../../../../src/presentation/tui/state-reading/useGlobalSearch.js";
import type { SearchResponse } from "../../../../../src/application/context/search/SearchResponse.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }

    await tick();
  }

  return readFrame() ?? "";
}

function GlobalSearchProbe(): React.ReactElement {
  const globalSearch = useGlobalSearch();
  useInput((input) => {
    if (input === "s") {
      void globalSearch.search("memory");
    }
  });

  return <Text>{globalSearch.data?.hits.length ?? "idle"}</Text>;
}

describe("useGlobalSearch", () => {
  it("dispatches a document-agnostic search request through the injected controller", async () => {
    const response: SearchResponse = {
      hits: [
        {
          source: { type: "component", id: "component_search" },
          category: "component",
          title: "Search",
          summary: null,
          snippet: null,
          facets: {},
          score: 1,
        },
      ],
    };
    const requests: unknown[] = [];
    const searchController = {
      handle: async (request: unknown) => {
        requests.push(request);
        return response;
      },
    };
    const { stdin, lastFrame, unmount } = render(
      <StateReaderProvider controllers={{ searchController }} options={{ tickMs: 0 }}>
        <GlobalSearchProbe />
      </StateReaderProvider>,
    );

    stdin.write("s");
    const frame = await waitForFrame(lastFrame, "1");

    expect(frame).toContain("1");
    expect(requests).toEqual([
      {
        criteria: {
          query: "memory",
          limit: 25,
        },
      },
    ]);
    unmount();
  });
});
