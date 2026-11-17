import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalsList } from "../../../../../../../src/presentation/cli/commands/goals/list/goals.list.js";
import { GetGoalsController } from "../../../../../../../src/application/context/goals/get/GetGoalsController.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { GoalsListDependencies } from "../../../../../../../src/presentation/cli/commands/goals/list/goals.list.js";

function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
  return {
    goalId: "goal_1",
    objective: "Test goal",
    successCriteria: [],
    scopeIn: [],
    scopeOut: [],
    status: "doing",
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
    progress: [],
    ...overrides,
  };
}

describe("goals.list command", () => {
  let mockContainer: Partial<GoalsListDependencies>;
  let mockGetGoalsController: jest.Mocked<Pick<GetGoalsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockGetGoalsController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getGoalsController: mockGetGoalsController as unknown as GetGoalsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all active goals by default", async () => {
    const mockGoals = [makeGoal({ goalId: "g1", status: "doing" })];
    mockGetGoalsController.handle.mockResolvedValue({ goals: mockGoals });

    await goalsList({}, mockContainer as GoalsListDependencies);

    expect(mockGetGoalsController.handle).toHaveBeenCalledWith({ statuses: undefined });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should pass parsed statuses to controller", async () => {
    mockGetGoalsController.handle.mockResolvedValue({ goals: [] });

    await goalsList({ status: "doing,blocked" }, mockContainer as GoalsListDependencies);

    expect(mockGetGoalsController.handle).toHaveBeenCalledWith({ statuses: ["doing", "blocked"] });
  });

  it("should show info message when no goals found", async () => {
    mockGetGoalsController.handle.mockResolvedValue({ goals: [] });

    await goalsList({}, mockContainer as GoalsListDependencies);

    expect(mockGetGoalsController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show status-specific message when filtering returns no results", async () => {
    mockGetGoalsController.handle.mockResolvedValue({ goals: [] });

    await goalsList({ status: "doing" }, mockContainer as GoalsListDependencies);

    expect(consoleSpy).toHaveBeenCalled();
  });
});
