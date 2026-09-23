import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import stripAnsi from "strip-ansi";
import { GoalsScreen } from "../../../../src/presentation/tui/goals/GoalsScreen.js";
import {
  GoalAuthoringRequestStatus,
  GoalAuthoringResultCopy,
} from "../../../../src/presentation/tui/goals/GoalAuthoringFlowConstants.js";
import { StateReaderProvider } from "../../../../src/presentation/tui/state-reading/StateReader.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";
import {
  GOAL_STATUS_FILTER_ALL,
  GOAL_STATUS_FILTERS,
} from "../../../../src/presentation/tui/goals/GoalsScreenConstants.js";
import type { GoalStatusType } from "../../../../src/domain/goals/Constants.js";
import type { GoalView } from "../../../../src/application/context/goals/GoalView.js";
import type { GoalContext } from "../../../../src/application/context/goals/get/GoalContext.js";
import type { GetGoalsRequest } from "../../../../src/application/context/goals/get/GetGoalsRequest.js";
import type { ShowGoalRequest } from "../../../../src/application/context/goals/get/ShowGoalRequest.js";
import type { AddGoalRequest } from "../../../../src/application/context/goals/add/AddGoalRequest.js";
import type { AddGoalResponse } from "../../../../src/application/context/goals/add/AddGoalResponse.js";
import type { RequestController } from "../../../../src/presentation/tui/action-dispatch/RequestController.js";

const DOWN_ARROW = "\u001B[B";
const RIGHT_ARROW = "\u001B[C";
const SPACE = " ";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

async function settleInput(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

async function waitUntil(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function submitAuthoringFlow(
  stdin: ReturnType<typeof render>["stdin"],
  readFrame: () => string | undefined,
  values: {
    readonly title: string;
    readonly objective: string;
    readonly criterion: string;
    readonly scopeIn?: readonly string[];
    readonly scopeOut?: readonly string[];
  },
): Promise<void> {
  stdin.write("n");
  await waitForFrame(readFrame, "Author Goal");

  stdin.write(values.title);
  await settleInput();
  stdin.write("\r");
  await settleInput();
  stdin.write(values.objective);
  await settleInput();
  stdin.write("\r");
  await waitForFrame(readFrame, "Success criterion");

  stdin.write(values.criterion);
  await settleInput();
  stdin.write("\r");
  await settleInput();
  stdin.write("\r");
  await waitForFrame(readFrame, "Scope in");

  await submitScopeCollection(
    stdin,
    readFrame,
    values.scopeIn ?? [],
    "Scope out",
  );
  await submitScopeCollection(
    stdin,
    readFrame,
    values.scopeOut ?? [],
    "Previous goal",
  );

  stdin.write("\r");
  await settleInput();
  stdin.write("\r");
  await settleInput();
  stdin.write("\r");
  await waitForFrame(readFrame, "Branch");

  stdin.write("\r");
  await settleInput();
  stdin.write("\r");
  await settleInput();
}

async function submitScopeCollection(
  stdin: ReturnType<typeof render>["stdin"],
  readFrame: () => string | undefined,
  items: readonly string[],
  nextStageText: string,
): Promise<void> {
  const submittedItems = items.length > 0 ? items : [""];

  for (const [index, item] of submittedItems.entries()) {
    stdin.write(item);
    await settleInput();
    stdin.write("\r");
    await settleInput();
    if (index < submittedItems.length - 1) {
      stdin.write("y");
      await settleInput();
    }
    stdin.write("\r");
    await settleInput();
  }

  await waitForFrame(readFrame, nextStageText);
}

async function navigateRightUntil(
  stdin: ReturnType<typeof render>["stdin"],
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(expectedText)) {
      return frame;
    }

    stdin.write(RIGHT_ARROW);
    await settleInput();
  }

  return readFrame() ?? "";
}

function renderGoalsScreen(
  options: {
    readonly statusFilter?: readonly GoalStatusType[];
    readonly goals?: readonly GoalView[];
    readonly contexts?: ReadonlyMap<string, GoalContext>;
    readonly handledRequests?: GetGoalsRequest[];
    readonly terminalWidth?: number;
    readonly shortcutsEnabled?: boolean;
    readonly addGoalController?: RequestController<
      AddGoalRequest,
      AddGoalResponse
    >;
    readonly onModalOpenChange?: (isOpen: boolean) => void;
  } = {},
): ReturnType<typeof render> {
  const goals = options.goals ?? [createGoal()];
  const contexts = options.contexts ?? new Map<string, GoalContext>();
  const handledRequests = options.handledRequests;

  return render(
    <StateReaderProvider
      controllers={{
        getGoalsController: {
          handle: async (request: GetGoalsRequest) => {
            handledRequests?.push(request);
            return {
              goals:
                request.statuses === undefined
                  ? [...goals]
                  : goals.filter((goal) =>
                      request.statuses?.includes(goal.status),
                    ),
            };
          },
        },
        showGoalController: {
          handle: async (request: ShowGoalRequest) => {
            const goal = goals.find((item) => item.goalId === request.goalId);
            if (goal === undefined) {
              throw new Error(`Goal not found: ${request.goalId}`);
            }

            return {
              contextualGoalView: {
                goal,
                context: contexts.get(request.goalId) ?? createGoalContext(),
              },
            };
          },
        },
      }}
      options={{ tickMs: 0 }}
    >
      <GoalsScreen
        statusFilter={options.statusFilter}
        terminalWidth={options.terminalWidth}
        shortcutsEnabled={options.shortcutsEnabled}
        addGoalController={options.addGoalController}
        onModalOpenChange={options.onModalOpenChange}
      />
    </StateReaderProvider>,
  );
}

describe("GoalsScreen", () => {
  it("renders the selected goal with the mock-up element set", async () => {
    const { lastFrame, unmount } = renderGoalsScreen();

    const frame = await waitForFrame(lastFrame, "Real goal");
    expect(frame).toContain("GOALS//");
    expect(frame).toContain("n");
    expect(frame).toContain("new");
    expect(frame).toContain("Showing:");
    expect(frame).toContain("State:");
    expect(frame).toContain("GOAL:");
    expect(frame).toContain("OBJECTIVE:");
    expect(frame).toContain("META-DATA");
    expect(frame).not.toContain("Title.....");
    expect(frame).toContain("Id........");
    expect(frame).toContain("Status....");
    expect(frame).toContain("Created...");
    expect(frame).toContain("Updated...");
    expect(frame).not.toContain("Objective.");
    expect(frame).toContain("Real goal");
    expect(frame).toContain("Render a goal from GetGoalsResponse");
    expect(frame).toContain("doing");
    expect(frame).not.toContain("WORKSPACE:");
    expect(frame).not.toContain("CLAIM:");
    expect(frame).not.toContain("Goal List");
    expect(frame).not.toContain("Goal Detail");
    expect(frame).not.toContain("Action Hints");
    expect(frame).not.toContain("current project");
    expect(frame).not.toContain("quit");
    unmount();
  });

  it("renders the screen divider across the terminal width", async () => {
    const terminalWidth = 48;
    const { lastFrame, unmount } = renderGoalsScreen({ terminalWidth });

    const frame = stripAnsi(await waitForFrame(lastFrame, "META-DATA:"));
    const dividerLine = frame
      .split("\n")
      .find((line) => /^─+$/.test(line.trim()));

    expect(dividerLine).toBeDefined();
    expect(dividerLine).toBe("─".repeat(terminalWidth));
    unmount();
  });

  it("moves through goals with up and down arrows inside the active filter", async () => {
    const goals = [
      createGoal({ goalId: "goal_first", title: "First goal" }),
      createGoal({ goalId: "goal_second", title: "Second goal" }),
    ];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({ goals });

    await waitForFrame(lastFrame, "First goal");
    stdin.write(DOWN_ARROW);

    const frame = await waitForFrame(lastFrame, "Second goal");
    expect(frame).toContain("2/2");
    unmount();
  });

  it("resets the newly selected goal to the objective metadata screen", async () => {
    const goals = [
      createGoal({ goalId: "goal_first", title: "First goal" }),
      createGoal({ goalId: "goal_second", title: "Second goal" }),
    ];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({ goals });

    await waitForFrame(lastFrame, "META-DATA");
    stdin.write(RIGHT_ARROW);
    await navigateRightUntil(stdin, lastFrame, "NOTE:");
    stdin.write(DOWN_ARROW);

    const frame = await waitForFrame(lastFrame, "Second goal");
    expect(frame).toContain("OBJECTIVE:");
    expect(frame).toContain("META-DATA");
    expect(frame).not.toContain("NOTE:");
    unmount();
  });

  it("resets selection to the first matching goal when the active state filter changes", async () => {
    const handledRequests: GetGoalsRequest[] = [];
    const goals = [
      createGoal({
        goalId: "goal_defined_first",
        title: "Defined first",
        status: GoalStatus.TODO,
      }),
      createGoal({
        goalId: "goal_defined_second",
        title: "Defined second",
        status: GoalStatus.TODO,
      }),
      createGoal({
        goalId: "goal_doing_first",
        title: "Doing first",
        status: GoalStatus.DOING,
      }),
      createGoal({
        goalId: "goal_doing_second",
        title: "Doing second",
        status: GoalStatus.DOING,
      }),
    ];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals,
      handledRequests,
    });

    await waitForFrame(lastFrame, "Defined first");
    stdin.write(DOWN_ARROW);
    await waitForFrame(lastFrame, "Defined second");
    stdin.write(SPACE);

    const frame = await waitForFrame(lastFrame, "Defined first");
    expect(frame).toContain("1/2");
    expect(frame).not.toContain("Doing second");
    expect(handledRequests).toContainEqual({});
    expect(handledRequests).toContainEqual({ statuses: [GoalStatus.TODO] });
    unmount();
  });

  it("moves horizontally through goal-show sections with left and right arrows", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen();

    await waitForFrame(lastFrame, "META-DATA");
    stdin.write(RIGHT_ARROW);

    const frame = await navigateRightUntil(stdin, lastFrame, "NOTE:");
    expect(frame).toContain("Goal note");
    unmount();
  });

  it("renders every available goal-show content section", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      contexts: new Map([
        ["goal_real", createGoalContext({ componentCount: 1 })],
      ]),
    });
    const expectedSections = [
      "OBJECTIVE:",
      "META-DATA",
      "NOTE:",
      "REVIEW ISSUES:",
      "SUCCESS CRITERIA:",
      "CURRENT PROGRESS:",
      "SCOPE:",
      "RELATED COMPONENTS",
      "RELATED DEPENDENCIES",
      "RELATED DECISIONS",
      "RELATED INVARIANTS",
      "RELATED GUIDELINES",
    ];

    for (const [index, section] of expectedSections.entries()) {
      const frame =
        index === 0
          ? await waitForFrame(lastFrame, section)
          : await navigateRightUntil(stdin, lastFrame, section);
      expect(frame).toContain(section);
    }
    unmount();
  });

  it("rolls workspace and claim fields into unpaginated metadata", async () => {
    const { lastFrame, unmount } = renderGoalsScreen();

    const frame = await waitForFrame(lastFrame, "META-DATA:");
    expect(frame).toContain("OBJECTIVE:");
    expect(frame).not.toContain("META-DATA (1/2):");
    expect(frame).not.toContain("Title.....");
    expect(frame).toContain("Branch....");
    expect(frame).toContain("feature/goals-browser");
    expect(frame).toContain("Worktree..");
    expect(frame).toContain("Claimed by");
    expect(frame).toContain("worker-1");
    expect(frame).not.toContain("Objective.");
    expect(frame.indexOf("OBJECTIVE:")).toBeLessThan(
      frame.indexOf("META-DATA:"),
    );
    expect(frame).not.toContain("WORKSPACE:");
    expect(frame).not.toContain("CLAIM:");
    unmount();
  });

  it("distinguishes scope in, scope out, and prerequisites", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen();

    await waitForFrame(lastFrame, "META-DATA");
    const frame = await navigateRightUntil(stdin, lastFrame, "SCOPE:");
    expect(frame).toContain("In........");
    expect(frame).toContain("src/presentation/tui/goals");
    expect(frame).toContain("Out.......");
    expect(frame).toContain("src/domain");
    expect(frame).toContain("Prereq....");
    expect(frame).toContain("goal_dependency");
    unmount();
  });

  it("paginates related entity rows at six items before rendering overflow", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      contexts: new Map([
        ["goal_real", createGoalContext({ componentCount: 7 })],
      ]),
    });

    await waitForFrame(lastFrame, "META-DATA");

    const firstPage = await navigateRightUntil(
      stdin,
      lastFrame,
      "RELATED COMPONENTS (1/2):",
    );
    expect(firstPage).toContain("RELATED COMPONENTS (1/2):");
    expect(firstPage).toContain("Component 6");
    expect(firstPage).not.toContain("Component 7");

    stdin.write(RIGHT_ARROW);
    await settleInput();
    const secondPage = await waitForFrame(lastFrame, "Component 7");
    expect(secondPage).toContain("RELATED COMPONENTS (2/2):");
    expect(secondPage).not.toContain("Component 1");

    stdin.write(RIGHT_ARROW);
    await settleInput();
    const nextSection = await waitForFrame(lastFrame, "RELATED DEPENDENCIES");
    expect(nextSection).not.toContain("Component 7");
    unmount();
  });

  it("truncates long related entity descriptions before they can overflow", async () => {
    const baseContext = createGoalContext();
    const longDescription = `${"lead ".repeat(60)}ZZTAIL`;
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      contexts: new Map([
        [
          "goal_real",
          {
            ...baseContext,
            invariants: baseContext.invariants.map((related) => ({
              ...related,
              entity: { ...related.entity, description: longDescription },
            })),
          },
        ],
      ]),
    });

    await waitForFrame(lastFrame, "META-DATA");
    const frame = await navigateRightUntil(
      stdin,
      lastFrame,
      "RELATED INVARIANTS",
    );
    expect(frame).toContain("...");
    expect(frame).not.toContain("ZZTAIL");
    unmount();
  });

  it("renders decisions with labeled fields, untruncated, two per page", async () => {
    const baseContext = createGoalContext();
    const [decision] = baseContext.decisions;
    const longContext = `${"lead ".repeat(60)}ZZTAIL`;
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      contexts: new Map([
        [
          "goal_real",
          {
            ...baseContext,
            decisions: Array.from({ length: 3 }, (_, index) => ({
              ...decision,
              entity: {
                ...decision.entity,
                decisionId: `decision_${index + 1}`,
                title: `Decision ${index + 1}`,
                context: longContext,
              },
            })),
          },
        ],
      ]),
    });

    await waitForFrame(lastFrame, "META-DATA");
    const firstPage = await navigateRightUntil(
      stdin,
      lastFrame,
      "RELATED DECISIONS (1/2):",
    );
    expect(firstPage).toContain("Decision 1");
    expect(firstPage).toContain("Decision 2");
    expect(firstPage).not.toContain("Decision 3");
    expect(firstPage).toContain("ZZTAIL");
    expect(firstPage).toContain("Keep backend domain data structured");

    stdin.write(RIGHT_ARROW);
    await settleInput();
    const secondPage = await waitForFrame(lastFrame, "Decision 3");
    expect(secondPage).toContain("RELATED DECISIONS (2/2):");
    expect(secondPage).not.toContain("Decision 1");
    unmount();
  });

  it("does not show a page marker for single-page success criteria", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals: [
        createGoal({
          successCriteria: ["First criterion", "Second criterion"],
        }),
      ],
    });

    await waitForFrame(lastFrame, "META-DATA");
    const frame = await navigateRightUntil(
      stdin,
      lastFrame,
      "SUCCESS CRITERIA:",
    );
    expect(frame).not.toContain("SUCCESS CRITERIA (1/2):");
    expect(frame).not.toContain("(1/2)");
    unmount();
  });

  it("shows page markers for multi-page success criteria", async () => {
    const successCriteria = Array.from(
      { length: 7 },
      (_, index) => `Criterion ${index + 1}`,
    );
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals: [
        createGoal({
          successCriteria,
        }),
      ],
    });

    await waitForFrame(lastFrame, "META-DATA");
    const firstPage = await navigateRightUntil(
      stdin,
      lastFrame,
      "SUCCESS CRITERIA (1/2):",
    );
    expect(firstPage).toContain("Criterion 6");
    expect(firstPage).not.toContain("Criterion 7");

    stdin.write(RIGHT_ARROW);
    await settleInput();
    const secondPage = await waitForFrame(lastFrame, "Criterion 7");
    expect(secondPage).toContain("SUCCESS CRITERIA (2/2):");
    expect(secondPage).not.toContain("Criterion 1");
    unmount();
  });

  it("cycles the state filter through every goal status", () => {
    const filterableStatuses = GOAL_STATUS_FILTERS.filter(
      (filter) => filter !== GOAL_STATUS_FILTER_ALL,
    );

    for (const status of new Set(Object.values(GoalStatus))) {
      expect(filterableStatuses).toContain(status);
    }
  });

  it("renders postponed goals and accepts a postponed navigation filter", async () => {
    const handledRequests: GetGoalsRequest[] = [];
    const { lastFrame, unmount } = renderGoalsScreen({
      statusFilter: [GoalStatus.POSTPONED],
      goals: [createGoal({
        goalId: "goal_postponed",
        title: "Deferred goal",
        status: GoalStatus.POSTPONED,
      })],
      handledRequests,
    });

    const frame = stripAnsi(await waitForFrame(lastFrame, "Deferred goal"));
    expect(frame).toContain("postponed");
    expect(handledRequests).toContainEqual({ statuses: [GoalStatus.POSTPONED] });
    unmount();
  });

  it("opens the goal authoring wizard from the goals screen", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen();

    stdin.write("n");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).toContain("Objective");
    unmount();
  });

  it("ignores its hotkeys when shortcutsEnabled is false", async () => {
    const handledRequests: GetGoalsRequest[] = [];
    const goals = [
      createGoal({ goalId: "goal_first", title: "First goal" }),
      createGoal({ goalId: "goal_second", title: "Second goal" }),
    ];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals,
      handledRequests,
      shortcutsEnabled: false,
    });

    await waitForFrame(lastFrame, "First goal");
    stdin.write("n");
    await settleInput();
    stdin.write(DOWN_ARROW);
    await settleInput();
    stdin.write(SPACE);
    await settleInput();

    expect(lastFrame()).not.toContain("Author Goal");
    expect(lastFrame()).toContain("1/2");
    expect(handledRequests).toContainEqual({});
    expect(handledRequests).not.toContainEqual(
      expect.objectContaining({ statuses: expect.anything() }),
    );
    unmount();
  });

  it("reports modal open state while the authoring flow opens and closes", async () => {
    const onModalOpenChange = jest.fn();
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      onModalOpenChange,
    });

    await waitForFrame(lastFrame, "Real goal");
    stdin.write("n");
    await waitForFrame(lastFrame, "Author Goal");

    expect(onModalOpenChange).toHaveBeenLastCalledWith(true);

    stdin.write("\x1b");
    await waitForFrame(lastFrame, "Real goal");

    expect(onModalOpenChange).toHaveBeenLastCalledWith(false);
    expect(lastFrame()).not.toContain("Author Goal");
    unmount();
  });

  it("keeps the authoring flow open and modal-reported while shell hotkeys are typed", async () => {
    const onModalOpenChange = jest.fn();
    const handledRequests: GetGoalsRequest[] = [];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      onModalOpenChange,
      handledRequests,
    });

    await waitForFrame(lastFrame, "Real goal");
    stdin.write("n");
    await waitForFrame(lastFrame, "Author Goal");
    onModalOpenChange.mockClear();

    stdin.write("m");
    await settleInput();
    stdin.write("/");
    await settleInput();
    stdin.write("i");
    await settleInput();
    stdin.write("q");
    await settleInput();
    stdin.write(SPACE);
    await settleInput();

    expect(lastFrame()).toContain("Author Goal");
    expect(onModalOpenChange).not.toHaveBeenCalled();
    expect(handledRequests).not.toContainEqual(
      expect.objectContaining({ statuses: expect.anything() }),
    );
    unmount();
  });

  it("dispatches an AddGoalRequest assembled from the entered authoring values", async () => {
    const dispatchedRequests: AddGoalRequest[] = [];
    const goals: GoalView[] = [createGoal()];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals,
      addGoalController: {
        handle: async (request: AddGoalRequest) => {
          dispatchedRequests.push(request);
          return { goalId: "goal_created" };
        },
      },
    });

    await waitForFrame(lastFrame, "Real goal");
    await submitAuthoringFlow(stdin, lastFrame, {
      title: "Created goal",
      objective: "Dispatch the authored goal",
      criterion: "Goal is persisted",
      scopeIn: ["src/presentation tui", "tests/presentation/tui"],
      scopeOut: ["src/application layer", "src/domain"],
    });
    await waitUntil(() => dispatchedRequests.length > 0);

    expect(dispatchedRequests).toHaveLength(1);
    expect(dispatchedRequests[0]).toEqual({
      title: "Created goal",
      objective: "Dispatch the authored goal",
      successCriteria: ["Goal is persisted"],
      scopeIn: ["src/presentation tui", "tests/presentation/tui"],
      scopeOut: ["src/application layer", "src/domain"],
    });
    unmount();
  });

  it("keeps success visible until acknowledgement, then refreshes and closes", async () => {
    const onModalOpenChange = jest.fn();
    const goals: GoalView[] = [];
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      goals,
      onModalOpenChange,
      addGoalController: {
        handle: async (request: AddGoalRequest) => {
          goals.push(
            createGoal({
              goalId: "goal_created",
              title: request.title,
              objective: request.objective,
              successCriteria: request.successCriteria,
            }),
          );
          return { goalId: "goal_created" };
        },
      },
    });

    await submitAuthoringFlow(stdin, lastFrame, {
      title: "Created goal",
      objective: "Dispatch the authored goal",
      criterion: "Goal is persisted",
    });

    const resultFrame = await waitForFrame(lastFrame, "goal_created");
    expect(resultFrame).toContain(GoalAuthoringRequestStatus.SUCCESS);
    expect(resultFrame).toContain(GoalAuthoringResultCopy.goalIdLabel);
    expect(resultFrame).not.toContain("Created goal");
    expect(onModalOpenChange).not.toHaveBeenLastCalledWith(false);

    stdin.write(SPACE);
    await settleInput();
    expect(lastFrame()).toContain("goal_created");

    stdin.write("\r");
    const frame = await waitForFrame(lastFrame, "Created goal");
    expect(frame).toContain("Created goal");
    expect(frame).toContain("1/1");
    expect(onModalOpenChange).toHaveBeenLastCalledWith(false);
    unmount();
  });

  it("keeps the flow open and interactive when the dispatch fails", async () => {
    const onModalOpenChange = jest.fn();
    const dispatched = jest.fn(async (_request: AddGoalRequest) => {
      throw new Error("dispatch failed");
    });
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      onModalOpenChange,
      addGoalController: { handle: dispatched },
    });

    await waitForFrame(lastFrame, "Real goal");
    await submitAuthoringFlow(stdin, lastFrame, {
      title: "Created goal",
      objective: "Dispatch the authored goal",
      criterion: "Goal is persisted",
    });
    await waitUntil(() => dispatched.mock.calls.length > 0);
    onModalOpenChange.mockClear();
    const failureFrame = await waitForFrame(
      lastFrame,
      GoalAuthoringRequestStatus.FAILURE,
    );

    expect(failureFrame).toContain("dispatch failed");
    expect(failureFrame).not.toContain(GoalAuthoringResultCopy.goalIdLabel);
    expect(onModalOpenChange).not.toHaveBeenCalledWith(false);

    stdin.write("\x1b");
    await waitForFrame(lastFrame, "Real goal");
    expect(onModalOpenChange).toHaveBeenLastCalledWith(false);
    unmount();
  });

  it("keeps the flow open when no add-goal controller is available", async () => {
    const onModalOpenChange = jest.fn();
    const { lastFrame, stdin, unmount } = renderGoalsScreen({
      onModalOpenChange,
    });

    await waitForFrame(lastFrame, "Real goal");
    await submitAuthoringFlow(stdin, lastFrame, {
      title: "Created goal",
      objective: "Dispatch the authored goal",
      criterion: "Goal is persisted",
    });
    onModalOpenChange.mockClear();
    const failureFrame = await waitForFrame(
      lastFrame,
      GoalAuthoringRequestStatus.FAILURE,
    );

    expect(failureFrame).not.toContain(GoalAuthoringResultCopy.goalIdLabel);
    expect(onModalOpenChange).not.toHaveBeenCalledWith(false);

    stdin.write("\x1b");
    await waitForFrame(lastFrame, "Real goal");
    expect(onModalOpenChange).toHaveBeenLastCalledWith(false);
    unmount();
  });
});

function createGoal(overrides: Partial<GoalView> = {}): GoalView {
  return {
    goalId: "goal_real",
    title: "Real goal",
    objective: "Render a goal from GetGoalsResponse",
    successCriteria: ["Goal response rendered"],
    scopeIn: ["src/presentation/tui/goals"],
    scopeOut: ["src/domain"],
    status: GoalStatus.DOING,
    version: 1,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
    progress: ["Wired to response"],
    prerequisiteGoals: ["goal_dependency"],
    nextGoalId: "goal_next",
    branch: "feature/goals-browser",
    worktree: "C:/projects/jumbo/cli",
    claimedBy: "worker-1",
    claimedAt: "2026-05-16T00:00:00.000Z",
    claimExpiresAt: "2026-05-16T01:00:00.000Z",
    note: "Goal note",
    reviewIssues: "Review issue",
    ...overrides,
  };
}

function createGoalContext(
  options: { readonly componentCount?: number } = {},
): GoalContext {
  const componentCount = options.componentCount ?? 0;

  return {
    components: Array.from({ length: componentCount }, (_, index) => {
      const displayIndex = index + 1;
      return {
        relationType: "involves",
        relationDescription: `Component relation ${displayIndex}`,
        entity: {
          componentId: `component_${displayIndex}`,
          name: `Component ${displayIndex}`,
          type: "ui",
          description: "Component description",
          responsibility: "Render UI",
          path: "src/presentation/tui/goals",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      };
    }),
    dependencies: [
      {
        relationType: "uses",
        relationDescription: "Renders TUI",
        entity: {
          dependencyId: "dep_ink",
          name: "Ink",
          ecosystem: "npm",
          packageName: "ink",
          versionConstraint: "^7.0.2",
          endpoint: null,
          contract: null,
          status: "active",
          version: 1,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
          removedAt: null,
          removalReason: null,
        },
      },
    ],
    decisions: [
      {
        relationType: "informs",
        relationDescription: "Presentation owns copy",
        entity: {
          decisionId: "decision_copy",
          title: "Presentation owns copy",
          context: "TUI copy",
          rationale: "Keep backend domain data structured",
          alternatives: [],
          consequences: null,
          status: "active",
          supersededBy: null,
          reversalReason: null,
          reversedAt: null,
          version: 1,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      },
    ],
    invariants: [
      {
        relationType: "requires",
        relationDescription: "No architecture entity",
        entity: {
          invariantId: "invariant_architecture",
          title: "Architecture entity is deprecated",
          description: "Use fine-grained memory primitives",
          rationale: null,
          version: 1,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      },
    ],
    guidelines: [
      {
        relationType: "guides",
        relationDescription: "Footer stays persistent",
        entity: {
          guidelineId: "guideline_footer",
          category: "codingStyle",
          title: "Footer actions stay app-wide",
          description: "Keep lifecycle actions in the owning screen",
          rationale: "Avoid footer churn",
          examples: [],
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          version: 1,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      },
    ],
  };
}
