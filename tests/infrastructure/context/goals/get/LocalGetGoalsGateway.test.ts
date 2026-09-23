import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetGoalsGateway } from "../../../../../src/application/context/goals/get/LocalGetGoalsGateway.js";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";

function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
  return {
    goalId: "goal_1",
    title: "Test goal",
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

describe("LocalGetGoalsGateway", () => {
  let gateway: LocalGetGoalsGateway;
  let mockReader: jest.Mocked<IGoalStatusReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findByStatus: jest.fn(),
    } as jest.Mocked<IGoalStatusReader>;

    gateway = new LocalGetGoalsGateway(mockReader);
  });

  it("should return all non-completed goals by default when no statuses specified", async () => {
    const allGoals = [
      makeGoal({ goalId: "g1", status: "doing" }),
      makeGoal({ goalId: "g2", status: "done" }),
      makeGoal({ goalId: "g3", status: "blocked" }),
    ];
    mockReader.findAll.mockResolvedValue(allGoals);

    const response = await gateway.getGoals({});

    expect(response.goals).toHaveLength(2);
    expect(response.goals.map(g => g.goalId)).toEqual(["g1", "g3"]);
  });

  it("keeps postponed goals visible in the default listing", async () => {
    mockReader.findAll.mockResolvedValue([
      makeGoal({ goalId: "postponed", status: "postponed" }),
      makeGoal({ goalId: "completed", status: "done" }),
    ]);

    const response = await gateway.getGoals({});

    expect(response.goals.map((goal) => goal.goalId)).toEqual(["postponed"]);
  });

  it("should filter by specified statuses", async () => {
    const allGoals = [
      makeGoal({ goalId: "g1", status: "doing" }),
      makeGoal({ goalId: "g2", status: "blocked" }),
      makeGoal({ goalId: "g3", status: "paused" }),
    ];
    mockReader.findAll.mockResolvedValue(allGoals);

    const response = await gateway.getGoals({ statuses: ["doing"] });

    expect(response.goals).toHaveLength(1);
    expect(response.goals[0].goalId).toBe("g1");
  });

  it("should throw on invalid status values", async () => {
    mockReader.findAll.mockResolvedValue([]);

    await expect(
      gateway.getGoals({ statuses: ["invalid-status"] })
    ).rejects.toThrow("Invalid status: invalid-status");
  });

  it("should return empty array when no goals match", async () => {
    mockReader.findAll.mockResolvedValue([
      makeGoal({ status: "done" }),
    ]);

    const response = await gateway.getGoals({ statuses: ["doing"] });

    expect(response.goals).toEqual([]);
  });

  it("should support multiple statuses", async () => {
    const allGoals = [
      makeGoal({ goalId: "g1", status: "doing" }),
      makeGoal({ goalId: "g2", status: "blocked" }),
      makeGoal({ goalId: "g3", status: "paused" }),
    ];
    mockReader.findAll.mockResolvedValue(allGoals);

    const response = await gateway.getGoals({ statuses: ["doing", "blocked"] });

    expect(response.goals).toHaveLength(2);
    expect(response.goals.map(g => g.goalId)).toEqual(["g1", "g2"]);
  });
});
