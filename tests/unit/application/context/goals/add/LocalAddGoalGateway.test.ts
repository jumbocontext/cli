import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddGoalGateway } from "../../../../../../src/application/context/goals/add/LocalAddGoalGateway.js";
import { AddGoalCommandHandler } from "../../../../../../src/application/context/goals/add/AddGoalCommandHandler.js";

describe("LocalAddGoalGateway", () => {
  let gateway: LocalAddGoalGateway;
  let mockCommandHandler: jest.Mocked<AddGoalCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddGoalCommandHandler>;

    gateway = new LocalAddGoalGateway(mockCommandHandler);
  });

  it("should execute command and return goal id", async () => {
    const goalId = "goal_123";

    mockCommandHandler.execute.mockResolvedValue({ goalId });

    const response = await gateway.addGoal({
      title: "Auth feature",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: ["AuthController"],
      scopeOut: ["AdminPanel"],
      nextGoalId: "goal_next",
      previousGoalId: "goal_prev",
    });

    expect(response.goalId).toBe(goalId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Auth feature",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: ["AuthController"],
      scopeOut: ["AdminPanel"],
      nextGoalId: "goal_next",
      previousGoalId: "goal_prev",
      prerequisiteGoals: undefined,
    });
  });

  it("should handle request with only required fields", async () => {
    const goalId = "goal_456";

    mockCommandHandler.execute.mockResolvedValue({ goalId });

    const response = await gateway.addGoal({
      title: "Bug fix",
      objective: "Fix bug #123",
      successCriteria: ["Bug is resolved"],
    });

    expect(response.goalId).toBe(goalId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Bug fix",
      objective: "Fix bug #123",
      successCriteria: ["Bug is resolved"],
      scopeIn: undefined,
      scopeOut: undefined,
      nextGoalId: undefined,
      previousGoalId: undefined,
      prerequisiteGoals: undefined,
    });
  });
});
