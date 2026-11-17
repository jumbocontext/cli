import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUnblockGoalGateway } from "../../../../../../src/application/context/goals/unblock/LocalUnblockGoalGateway.js";
import { UnblockGoalCommandHandler } from "../../../../../../src/application/context/goals/unblock/UnblockGoalCommandHandler.js";

describe("LocalUnblockGoalGateway", () => {
  let gateway: LocalUnblockGoalGateway;
  let mockCommandHandler: jest.Mocked<UnblockGoalCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UnblockGoalCommandHandler>;

    gateway = new LocalUnblockGoalGateway(mockCommandHandler);
  });

  it("should execute command and return response with note", async () => {
    const goalId = "goal_123";
    const note = "API credentials received";

    mockCommandHandler.execute.mockResolvedValue({ goalId });

    const response = await gateway.unblockGoal({ goalId, note });

    expect(response.goalId).toBe(goalId);
    expect(response.note).toBe(note);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId,
      note,
    });
  });

  it("should execute command and return response without note", async () => {
    const goalId = "goal_456";

    mockCommandHandler.execute.mockResolvedValue({ goalId });

    const response = await gateway.unblockGoal({ goalId });

    expect(response.goalId).toBe(goalId);
    expect(response.note).toBeUndefined();
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId,
      note: undefined,
    });
  });
});
