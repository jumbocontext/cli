import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import stripAnsi from "strip-ansi";
import { GoalAuthoringFlow } from "../../../../../src/presentation/tui/goals/GoalAuthoringFlow.js";
import type {
  GoalAuthoringSubmissionResult,
  GoalAuthoringValues,
} from "../../../../../src/presentation/tui/goals/GoalAuthoringFlow.js";
import {
  GOAL_AUTHORING_RESULT_PANEL_WIDTH,
  GoalAuthoringRequestStatus,
  GoalAuthoringResultCopy,
} from "../../../../../src/presentation/tui/goals/GoalAuthoringFlowConstants.js";
import { WizardValidationCopy } from "../../../../../src/presentation/tui/wizard/WizardConstants.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const CTRL_B = "\x02";
const SUCCESSFUL_SUBMISSION: GoalAuthoringSubmissionResult = {
  status: GoalAuthoringRequestStatus.SUCCESS,
  goalId: "goal_created",
};
const completeSuccessfully = async () => SUCCESSFUL_SUBMISSION;
const waitForFrame = async (
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await tick();
    const frame = lastFrame() ?? "";
    if (predicate(frame)) {
      return frame;
    }
  }
  throw new Error(`Timed out waiting for frame:\n${lastFrame() ?? ""}`);
};

describe("GoalAuthoringFlow", () => {
  it("renders the objective step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <GoalAuthoringFlow
        onComplete={completeSuccessfully}
        onCancel={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Author Goal");
    expect(frame).toContain("Title");
    expect(frame).toContain("Objective");
    expect(frame).toContain("1/5");
    expect(frame).toContain("esc");
    unmount();
  });

  it("wraps a long objective without expanding the wizard backdrop", async () => {
    const objective =
      "Allow full fidelity view of a Decision by extending the commands with 'jumbo decision show --id'. Today only summaries are visible via 'jumbo decisions list'";
    const { lastFrame, stdin, unmount } = render(
      <GoalAuthoringFlow
        onComplete={completeSuccessfully}
        onCancel={() => {}}
      />,
    );

    stdin.write("Demonstration");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(objective);
    const frame = stripAnsi(
      await waitForFrame(
        lastFrame,
        (renderedFrame) =>
          renderedFrame.includes("list'") && renderedFrame.includes("▎"),
      ),
    );

    expect(
      frame.split("\n").every((line) => line.trimStart().length <= 88),
    ).toBe(true);
    expect(frame.replace(/\s+/g, " ")).toContain(objective);
    expect(frame.replace(/\s+/g, " ")).toContain(`list'▎`);
    expect(frame).toContain("▎");
    expect(frame).toContain("Title");
    expect(frame).toContain("Objective");
    expect(frame).toContain("1/5");
    unmount();
  });

  it("includes all goal authoring steps", async () => {
    const { lastFrame, stdin, unmount } = render(
      <GoalAuthoringFlow
        onComplete={completeSuccessfully}
        onCancel={() => {}}
      />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Success criterion");
    expect(lastFrame()).toContain("2/5");

    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Scope in item (optional)");
    expect(lastFrame()).toContain("3/5");

    stdin.write("src/presentation/tui");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out item"));
    stdin.write("src/application");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Previous goal (optional)");
    expect(lastFrame()).toContain("4/5");
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Branch (optional)");
    expect(lastFrame()).toContain("5/5");
    unmount();
  });

  it("collects criteria and multiple scope items as arrays", async () => {
    const handleComplete = jest.fn(async () => SUCCESSFUL_SUBMISSION);
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={handleComplete} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();

    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await tick();

    stdin.write("Shows goal detail");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("src/presentation/tui goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await waitForFrame(
      lastFrame,
      (frame) =>
        frame.includes("Add another scope-in item?") &&
        !frame.includes("src/presentation/tui goals"),
    );
    stdin.write("tests/presentation/tui");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Add another scope-out item?"),
    );

    stdin.write("src/application layer");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await waitForFrame(
      lastFrame,
      (frame) =>
        frame.includes("Add another scope-out item?") &&
        !frame.includes("src/application layer"),
    );
    stdin.write("src/domain");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write("goal_previous");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("goal_next");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("goal_prerequisite");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("feature/prototype-s2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("../jumbo-prototype-s2");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, () => handleComplete.mock.calls.length > 0);

    expect(handleComplete).toHaveBeenCalledWith({
      title: "Prototype S2",
      objective: "Prototype the Goals screen",
      successCriteria: ["Renders goals", "Shows goal detail"],
      scopeIn: ["src/presentation/tui goals", "tests/presentation/tui"],
      scopeOut: ["src/application layer", "src/domain"],
      previousGoal: "goal_previous",
      nextGoal: "goal_next",
      prerequisiteGoals: "goal_prerequisite",
      branch: "feature/prototype-s2",
      worktree: "../jumbo-prototype-s2",
    });
    unmount();
  });

  it("allows scope boundaries to be left blank", async () => {
    const handleComplete = jest.fn(async () => SUCCESSFUL_SUBMISSION);
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={handleComplete} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out"));
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));
    expect(lastFrame()).not.toContain(WizardValidationCopy.required);

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, () => handleComplete.mock.calls.length > 0);

    expect(handleComplete).toHaveBeenCalledWith({
      title: "Prototype S2",
      objective: "Prototype the Goals screen",
      successCriteria: ["Renders goals"],
      scopeIn: [],
      scopeOut: [],
      previousGoal: "",
      nextGoal: "",
      prerequisiteGoals: "",
      branch: "",
      worktree: "",
    });
    unmount();
  });

  it("preserves scope items when navigating backward and forward", async () => {
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow
        onComplete={completeSuccessfully}
        onCancel={() => {}}
      />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));
    stdin.write("src/presentation tui");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out item"));
    stdin.write("src/application layer");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write(CTRL_B);
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out item"));
    expect(lastFrame()).toContain("src/application layer");

    stdin.write(CTRL_B);
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in item"));
    expect(lastFrame()).toContain("src/presentation tui");

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out item"));
    expect(lastFrame()).toContain("src/application layer");

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write(CTRL_B);
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope out item"));
    stdin.write(CTRL_B);
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in item"));
    stdin.write(CTRL_B);
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Success criterion"),
    );
    expect(lastFrame()).toContain("Renders goals");

    stdin.write(CTRL_B);
    await waitForFrame(
      lastFrame,
      (frame) => frame.includes("Title") && frame.includes("Objective"),
    );
    expect(lastFrame()).toContain("Prototype S2");
    expect(lastFrame()).toContain("Prototype the Goals screen");
    unmount();
  });

  it("replaces the wizard with pending and keeps success visible until acknowledged", async () => {
    let resolveSubmission:
      | ((result: GoalAuthoringSubmissionResult) => void)
      | undefined;
    const submission = new Promise<GoalAuthoringSubmissionResult>((resolve) => {
      resolveSubmission = resolve;
    });
    const onComplete = jest.fn(
      async (_values: GoalAuthoringValues) => submission,
    );
    const onSuccessAcknowledged = jest.fn();
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow
        onComplete={onComplete}
        onSuccessAcknowledged={onSuccessAcknowledged}
        onCancel={() => {}}
      />,
    );

    await submitMinimalAuthoringFlow(stdin, lastFrame);

    const pendingFrame = await waitForFrame(lastFrame, (frame) =>
      frame.includes(GoalAuthoringRequestStatus.PENDING),
    );
    expect(pendingFrame).toContain(GoalAuthoringResultCopy.pending);
    expect(pendingFrame).not.toContain(GoalAuthoringResultCopy.goalIdLabel);
    expect(pendingFrame).not.toContain("Branch (optional)");

    resolveSubmission?.(SUCCESSFUL_SUBMISSION);
    const successFrame = await waitForFrame(lastFrame, (frame) =>
      frame.includes(GoalAuthoringRequestStatus.SUCCESS),
    );
    expect(successFrame).toContain(GoalAuthoringResultCopy.success);
    expect(successFrame).toContain(SUCCESSFUL_SUBMISSION.goalId);

    await tick();
    expect(lastFrame()).toContain(SUCCESSFUL_SUBMISSION.goalId);
    expect(onSuccessAcknowledged).not.toHaveBeenCalled();

    stdin.write("\r");
    await waitForFrame(
      lastFrame,
      () => onSuccessAcknowledged.mock.calls.length === 1,
    );
    expect(onSuccessAcknowledged).toHaveBeenCalledWith(
      SUCCESSFUL_SUBMISSION.goalId,
    );
    unmount();
  });

  it("shows failure without a goal ID and retries with every value preserved", async () => {
    const onComplete = jest
      .fn<
        (values: GoalAuthoringValues) => Promise<GoalAuthoringSubmissionResult>
      >()
      .mockResolvedValueOnce({
        status: GoalAuthoringRequestStatus.FAILURE,
        error: "normalized dispatch failure",
      })
      .mockResolvedValueOnce(SUCCESSFUL_SUBMISSION);
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={onComplete} onCancel={() => {}} />,
    );

    await submitMinimalAuthoringFlow(stdin, lastFrame, {
      branch: "feature/preserved",
      worktree: "../preserved-worktree",
    });
    const failureFrame = await waitForFrame(lastFrame, (frame) =>
      frame.includes(GoalAuthoringRequestStatus.FAILURE),
    );
    expect(failureFrame).toContain("normalized dispatch failure");
    expect(failureFrame).not.toContain(GoalAuthoringResultCopy.goalIdLabel);

    stdin.write("\r");
    const retryFrame = await waitForFrame(lastFrame, (frame) =>
      frame.includes("Branch (optional)"),
    );
    expect(retryFrame).toContain("feature/preserved");
    expect(retryFrame).toContain("../preserved-worktree");

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, () => onComplete.mock.calls.length === 2);

    expect(onComplete.mock.calls[1]?.[0]).toEqual(
      onComplete.mock.calls[0]?.[0],
    );
    expect(lastFrame()).toContain(SUCCESSFUL_SUBMISSION.goalId);
    unmount();
  });

  it("cancels from failure and bounds long result content", async () => {
    const onCancel = jest.fn();
    const longError = "dispatch failure ".repeat(100);
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow
        onComplete={async () => ({
          status: GoalAuthoringRequestStatus.FAILURE,
          error: longError,
        })}
        onCancel={onCancel}
      />,
    );

    await submitMinimalAuthoringFlow(stdin, lastFrame);
    const failureFrame = stripAnsi(
      await waitForFrame(lastFrame, (frame) =>
        frame.includes(GoalAuthoringRequestStatus.FAILURE),
      ),
    );

    expect(failureFrame).not.toContain(longError);
    const longestRenderedLine = Math.max(
      ...failureFrame.split("\n").map((line) => line.trimStart().length),
    );
    expect(longestRenderedLine).toBeLessThanOrEqual(
      GOAL_AUTHORING_RESULT_PANEL_WIDTH,
    );

    stdin.write("\x1b");
    await waitForFrame(lastFrame, () => onCancel.mock.calls.length === 1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    unmount();
  });
});

async function submitMinimalAuthoringFlow(
  stdin: ReturnType<typeof render>["stdin"],
  lastFrame: () => string | undefined,
  workspace: {
    readonly branch?: string;
    readonly worktree?: string;
  } = {},
): Promise<void> {
  stdin.write("Goal title");
  await tick();
  stdin.write("\r");
  await tick();
  stdin.write("Goal objective");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("Success criterion"));
  stdin.write("Goal criterion");
  await tick();
  stdin.write("\r");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));
  stdin.write("\r");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("Scope out"));
  stdin.write("\r");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));
  stdin.write("\r");
  await tick();
  stdin.write("\r");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));
  stdin.write(workspace.branch ?? "");
  await tick();
  stdin.write("\r");
  await tick();
  stdin.write(workspace.worktree ?? "");
  await tick();
  stdin.write("\r");
}
