import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { StateReaderProvider } from "../../../../../src/presentation/tui/state-reading/StateReader.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("CockpitLaunchpadView", () => {
  it("renders the launch animation until the injected renderer reports completion", () => {
    const onDone = jest.fn();
    const onLaunchAnimationDone = jest.fn();
    const launchAnimationRenderer = jest.fn(({ onDone: complete }) => {
      onDone.mockImplementation(complete);
      return <Text>launching cockpit</Text>;
    });
    const { lastFrame, rerender, unmount } = render(
      <CockpitLaunchpadView
        launchAnimationSize={{ width: 80, height: 24 }}
        launchAnimationRenderer={launchAnimationRenderer}
        onLaunchAnimationDone={onLaunchAnimationDone}
      />,
    );

    expect(lastFrame()).toContain("launching cockpit");
    expect(launchAnimationRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ width: 80, height: 24 }),
    );

    onDone();
    rerender(
      <CockpitLaunchpadView
        launchAnimationSize={{ width: 80, height: 24 }}
        launchAnimationRenderer={launchAnimationRenderer}
        onLaunchAnimationDone={onLaunchAnimationDone}
      />,
    );

    expect(onLaunchAnimationDone).toHaveBeenCalledTimes(1);
    expect(lastFrame()).not.toContain("launching cockpit");
    unmount();
  });

  it("renders project stats above daemon panels", async () => {
    const projectStatsController = {
      handle: async () => ({
        snapshot: {
          project: {
            audiences: {
              totalAudiences: 3,
              primaryAudiences: 1,
              secondaryAudiences: 2,
            },
            audiencePains: {
              audiencePainsCount: 4,
            },
            valuePropositions: {
              valuePropositionsCount: 2,
            },
          },
          work: {
            goals: {
              definedGoalsCount: 1,
              refinedGoalsCount: 2,
              inProgressGoalsCount: 1,
              submittedGoalsCount: 1,
              closedGoalsCount: 0,
            },
            sessions: {
              sessionsCount: 2,
            },
          },
          memory: {
            decisions: {
              decisionsCount: 4,
            },
            components: {
              componentsCount: 2,
            },
            dependencies: {
              dependenciesCount: 1,
            },
            invariants: {
              invariantsCount: 1,
            },
            guidelines: {
              guidelinesCount: 1,
            },
          },
          graph: {
            relationCount: 6,
          },
        },
      }),
    };

    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ projectStatsController }}
        options={{ tickMs: 0 }}
      >
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </StateReaderProvider>,
    );

    await tick();
    const frame = lastFrame() ?? "";

    expect(frame.indexOf("STATS//")).toBeGreaterThanOrEqual(0);
    expect(frame.indexOf("STATS//")).toBeLessThan(frame.indexOf("REFINER"));
    unmount();
  });
});
