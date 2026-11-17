import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalBlockGoalGateway } from "../../../../../../src/application/context/goals/block/LocalBlockGoalGateway.js";
import { BlockGoalCommandHandler } from "../../../../../../src/application/context/goals/block/BlockGoalCommandHandler.js";

describe("LocalBlockGoalGateway", () => {
  let gateway: LocalBlockGoalGateway;
  let mockCommandHandler: jest.Mocked<BlockGoalCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<BlockGoalCommandHandler>;

    gateway = new LocalBlockGoalGateway(mockCommandHandler);
  });

  it("should execute command and return response", async () => {
    const goalId = "goal_123";
    const note = "Waiting for API credentials";

    mockCommandHandler.execute.mockResolvedValue({ goalId });

    const response = await gateway.blockGoal({ goalId, note });

    expect(response.goalId).toBe(goalId);
    expect(response.note).toBe(note);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId,
      note,
    });
  });
});
