import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text, useInput } from "ink";
import { render } from "ink-testing-library";
import {
  StateReaderProvider,
} from "../../../../../src/presentation/tui/state-reading/StateReader.js";
import { useGoalsList } from "../../../../../src/presentation/tui/state-reading/useGoalsList.js";
import { useProjectContext } from "../../../../../src/presentation/tui/state-reading/useProjectContext.js";
import { useProjectStats } from "../../../../../src/presentation/tui/state-reading/useProjectStats.js";
import { useGlobalSearch } from "../../../../../src/presentation/tui/state-reading/useGlobalSearch.js";
import type { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import type { SearchResponse } from "../../../../../src/application/context/search/SearchResponse.js";
import { GoalStatus } from "../../../../../src/domain/goals/Constants.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return readFrame() ?? "";
}

const GOAL_VIEW: GoalView = {
  goalId: "goal_reader",
  title: "Wire reader",
  objective: "Read goals through controller",
  successCriteria: ["Controller response rendered"],
  scopeIn: ["src/presentation/tui"],
  scopeOut: ["src/domain"],
  status: "refined",
  version: 1,
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
  progress: [],
};
const REFINED_GOAL_STATUS_FILTER = [GoalStatus.REFINED] as const;

function ProjectContextProbe(): React.ReactElement {
  const projectContext = useProjectContext();
  return <Text>{projectContext.data?.name ?? "loading"}</Text>;
}

function GoalsListProbe(): React.ReactElement {
  const goalsList = useGoalsList(REFINED_GOAL_STATUS_FILTER);
  useInput((input) => {
    if (input === "r") {
      void goalsList.refresh();
    }
  });

  return <Text>{goalsList.data?.goals.length ?? 0}</Text>;
}

function ProjectStatsProbe(): React.ReactElement {
  const projectStats = useProjectStats();
  return (
    <Text>
      {projectStats.data?.snapshot.work.goals.refinedGoalsCount ?? "loading"}
    </Text>
  );
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

describe("StateReader", () => {
  it("reads project context through the injected query handler", async () => {
    const getProjectSummaryQueryHandler = {
      execute: async () => ({
        name: "Jumbo Project",
        purpose: "Context orchestration",
        lifecycleState: "primed" as const,
      }),
    };

    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ getProjectSummaryQueryHandler }}
        options={{ tickMs: 0 }}
      >
        <ProjectContextProbe />
      </StateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "Jumbo Project");

    expect(frame).toContain("Jumbo Project");
    unmount();
  });

  it("passes status filters to the goals controller", async () => {
    const handledRequests: unknown[] = [];
    const getGoalsController = {
      handle: async (request: unknown) => {
        handledRequests.push(request);
        return { goals: [GOAL_VIEW] };
      },
    };

    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 0 }}
      >
        <GoalsListProbe />
      </StateReaderProvider>,
    );

    await tick();

    expect(lastFrame()).toContain("1");
    expect(handledRequests).toEqual([{ statuses: ["refined"] }]);
    unmount();
  });

  it("reads project stats through the injected controller", async () => {
    const projectStatsController = {
      handle: async (request: unknown) => ({
        request,
        snapshot: {
          project: {
            audiences: {
              totalAudiences: 0,
              primaryAudiences: 0,
              secondaryAudiences: 0,
            },
            audiencePains: {
              audiencePainsCount: 0,
            },
            valuePropositions: {
              valuePropositionsCount: 0,
            },
          },
          work: {
            goals: {
              definedGoalsCount: 0,
              refinedGoalsCount: 1,
              inProgressGoalsCount: 0,
              submittedGoalsCount: 0,
              closedGoalsCount: 0,
            },
            sessions: {
              sessionsCount: 0,
            },
          },
          memory: {
            decisions: {
              decisionsCount: 0,
            },
            components: {
              componentsCount: 0,
            },
            dependencies: {
              dependenciesCount: 0,
            },
            invariants: {
              invariantsCount: 0,
            },
            guidelines: {
              guidelinesCount: 0,
            },
          },
          graph: {
            relationCount: 0,
          },
        },
      }),
    };

    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ projectStatsController }}
        options={{ tickMs: 0 }}
      >
        <ProjectStatsProbe />
      </StateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "1");

    expect(frame).toContain("1");
    unmount();
  });

  it("can refresh read models on explicit demand", async () => {
    let goalCount = 0;
    const getGoalsController = {
      handle: async () => {
        goalCount += 1;
        return {
          goals: Array.from({ length: goalCount }, (_, index) => ({
            ...GOAL_VIEW,
            goalId: `goal_${index}`,
          })),
        };
      },
    };

    const { stdin, lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 0 }}
      >
        <GoalsListProbe />
      </StateReaderProvider>,
    );

    await tick();
    expect(lastFrame()).toContain("1");

    stdin.write("r");
    await tick();

    expect(lastFrame()).toContain("2");
    unmount();
  });

  it("dispatches global search requests through the injected controller", async () => {
    const response: SearchResponse = {
      hits: [
        {
          source: { type: "component", id: "component_reader" },
          category: "component",
          title: "Reader",
          summary: null,
          snippet: null,
          facets: {},
          score: 10,
        },
      ],
      groups: [],
    };
    const searchRequests: unknown[] = [];
    const searchController = {
      handle: async (request: unknown) => {
        searchRequests.push(request);
        return response;
      },
    };

    const { stdin, lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ searchController }}
        options={{ tickMs: 0 }}
      >
        <GlobalSearchProbe />
      </StateReaderProvider>,
    );

    stdin.write("s");
    const frame = await waitForFrame(lastFrame, "1");

    expect(frame).toContain("1");
    expect(searchRequests).toEqual([
      {
        criteria: {
          query: "memory",
          limit: 25,
        },
      },
    ]);
    unmount();
  });

  it("re-reads on the configured tick", async () => {
    let readCount = 0;
    const getGoalsController = {
      handle: async () => {
        readCount += 1;
        return { goals: [GOAL_VIEW] };
      },
    };

    const { unmount } = render(
      <StateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 10 }}
      >
        <GoalsListProbe />
      </StateReaderProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 35));

    expect(readCount).toBeGreaterThan(1);
    unmount();
  });
});
