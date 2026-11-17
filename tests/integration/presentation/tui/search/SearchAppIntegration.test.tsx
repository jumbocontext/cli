import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import type { SearchResponse } from "../../../../../src/application/context/search/SearchResponse.js";

interface ScreenRouterProps {
  readonly shortcutsEnabled?: boolean;
}

interface HeaderProps {
  readonly projectName: string;
}

const mockScreenRouter = jest.fn<(props: ScreenRouterProps) => React.ReactElement>(
  (props) => <Text>ScreenRouter {String(props.shortcutsEnabled)}</Text>,
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/navigation/ScreenRouter.js",
  () => ({
    ScreenRouter: mockScreenRouter,
  }),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/application-shell/Header.js",
  () => ({
    Header: (props: HeaderProps) => (
      <Box>
        <Text>{props.projectName}</Text>
      </Box>
    ),
  }),
);

const { App } = await import(
  "../../../../../src/presentation/tui/application-shell/App.js"
);

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    await tick();
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }
  }

  return readFrame() ?? "";
}

describe("SearchAppIntegration", () => {
  it("keeps the routed screen mounted and disables surrounding shortcuts while search owns input", async () => {
    const searchResponse: SearchResponse = {
      hits: [
        {
          source: { type: "component", id: "component_search" },
          category: "component",
          title: "Search Surface",
          summary: "Search owns typed input.",
          snippet: null,
          facets: {},
          score: 10,
        },
      ],
      groups: [],
    };
    const searchController = {
      handle: jest.fn(async () => searchResponse),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        launchAnimationEnabled={false}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: {
            execute: async () => ({
              name: "Test Project",
              purpose: null,
              lifecycleState: "primed-empty" as const,
            }),
          },
          searchController,
        }}
      />,
    );

    await waitForFrame(lastFrame, "ScreenRouter true");

    stdin.write("/");
    await waitForFrame(lastFrame, "search memory");

    expect(mockScreenRouter).toHaveBeenLastCalledWith(
      expect.objectContaining({ shortcutsEnabled: false }),
      undefined,
    );

    stdin.write("gq");
    await waitForFrame(lastFrame, "Search Surface");

    expect(lastFrame()).toContain("gq");
    expect(lastFrame()).not.toContain("Author Goal");
    expect(searchController.handle).toHaveBeenCalledWith({
      criteria: {
        query: "gq",
        limit: 25,
      },
    });
    unmount();
  }, 10000);
});
