import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { StateReaderProvider } from "../../../../../src/presentation/tui/state-reading/StateReader.js";
import { useGoalContext } from "../../../../../src/presentation/tui/state-reading/useGoalContext.js";
import { GoalStatus } from "../../../../../src/domain/goals/Constants.js";
import type { GoalContext } from "../../../../../src/application/context/goals/get/GoalContext.js";
import type { ShowGoalRequest } from "../../../../../src/application/context/goals/get/ShowGoalRequest.js";

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

function GoalContextProbe(): React.ReactElement {
  const goalContext = useGoalContext("goal_context");
  return (
    <Text>
      {goalContext.data?.contextualGoalView.context.components.length ?? "loading"}
    </Text>
  );
}

describe("useGoalContext", () => {
  it("reads contextual goal data through the injected show-goal controller", async () => {
    const requests: ShowGoalRequest[] = [];
    const context: GoalContext = {
      components: [
        {
          relationType: "involves",
          relationDescription: "Component context",
          entity: {
            componentId: "component_context",
            name: "Context",
            type: "ui",
            description: "Context component",
            responsibility: "Render context",
            path: "src/presentation/tui/state-reading",
            status: "active",
            deprecationReason: null,
            version: 1,
            createdAt: "2026-05-15T00:00:00.000Z",
            updatedAt: "2026-05-15T00:00:00.000Z",
          },
        },
      ],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
    };
    const showGoalController = {
      handle: async (request: ShowGoalRequest) => {
        requests.push(request);
        return {
          contextualGoalView: {
            goal: {
              goalId: request.goalId,
              title: "Context goal",
              objective: "Read contextual goal data",
              successCriteria: ["Context returned"],
              scopeIn: ["src/presentation/tui/state-reading"],
              scopeOut: ["src/domain"],
              status: GoalStatus.DOING,
              version: 1,
              createdAt: "2026-05-15T00:00:00.000Z",
              updatedAt: "2026-05-15T00:00:00.000Z",
              progress: [],
            },
            context,
          },
        };
      },
    };

    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{ showGoalController }}
        options={{ tickMs: 0 }}
      >
        <GoalContextProbe />
      </StateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "1");

    expect(frame).toContain("1");
    expect(requests).toEqual([{ goalId: "goal_context" }]);
    unmount();
  });
});
