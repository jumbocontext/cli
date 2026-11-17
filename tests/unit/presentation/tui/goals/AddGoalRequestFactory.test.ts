import { describe, expect, it } from "@jest/globals";
import { AddGoalRequestFactory } from "../../../../../src/presentation/tui/goals/AddGoalRequestFactory.js";
import type { GoalAuthoringValues } from "../../../../../src/presentation/tui/goals/GoalAuthoringFlow.js";

describe("AddGoalRequestFactory", () => {
  it("maps multiple scope items without changing their order or content", () => {
    const values = authoringValues({
      scopeIn: ["src/presentation tui", "tests/presentation/tui"],
      scopeOut: ["src/application layer", "src/domain"],
    });

    const request = AddGoalRequestFactory.create(values);

    expect(request.scopeIn).toEqual([
      "src/presentation tui",
      "tests/presentation/tui",
    ]);
    expect(request.scopeOut).toEqual(["src/application layer", "src/domain"]);
  });

  it("maps a single scope item as one array element", () => {
    const request = AddGoalRequestFactory.create(
      authoringValues({
        scopeIn: ["one scope in item"],
        scopeOut: ["one scope out item"],
      }),
    );

    expect(request.scopeIn).toEqual(["one scope in item"]);
    expect(request.scopeOut).toEqual(["one scope out item"]);
  });

  it("maps empty scope arrays to undefined", () => {
    const request = AddGoalRequestFactory.create(authoringValues());

    expect(request.scopeIn).toBeUndefined();
    expect(request.scopeOut).toBeUndefined();
  });
});

function authoringValues(
  overrides: Partial<GoalAuthoringValues> = {},
): GoalAuthoringValues {
  return {
    title: "Goal title",
    objective: "Goal objective",
    successCriteria: ["Goal criterion"],
    scopeIn: [],
    scopeOut: [],
    nextGoal: "",
    previousGoal: "",
    prerequisiteGoals: "",
    branch: "",
    worktree: "",
    ...overrides,
  };
}
