/**
 * Tests for LocalPauseGoalGateway
 * Verifies gateway delegates to command handler and reader correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { LocalPauseGoalGateway } from "../../../../../../src/application/context/goals/pause/LocalPauseGoalGateway";
import { PauseGoalCommandHandler } from "../../../../../../src/application/context/goals/pause/PauseGoalCommandHandler";
import { IGoalPauseReader } from "../../../../../../src/application/context/goals/pause/IGoalPauseReader";
import { GoalPausedReasonsType } from "../../../../../../src/domain/goals/GoalPausedReasons";

describe("LocalPauseGoalGateway", () => {
  let gateway: LocalPauseGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<PauseGoalCommandHandler, "execute">>;
  let mockGoalReader: jest.Mocked<IGoalPauseReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn<PauseGoalCommandHandler["execute"]>(),
    };
    mockGoalReader = {
      findById: jest.fn<IGoalPauseReader["findById"]>(),
    };
    gateway = new LocalPauseGoalGateway(
      mockCommandHandler as unknown as PauseGoalCommandHandler,
      mockGoalReader
    );
  });

  it("should execute command and return response with goal view", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_123" });
    mockGoalReader.findById.mockResolvedValue({
      goalId: "goal_123",
      objective: "Test objective",
      status: "paused",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      version: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      progress: [],
    });

    const result = await gateway.pauseGoal({
      goalId: "goal_123",
      reason: "WorkPaused",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      reason: "WorkPaused",
      note: undefined,
    });
    expect(mockGoalReader.findById).toHaveBeenCalledWith("goal_123");
    expect(result).toEqual({
      goalId: "goal_123",
      objective: "Test objective",
      status: "paused",
      reason: "WorkPaused",
    });
  });

  it("should pass note to command handler", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_123" });
    mockGoalReader.findById.mockResolvedValue({
      goalId: "goal_123",
      objective: "Test objective",
      status: "paused",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      version: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      progress: [],
    });

    await gateway.pauseGoal({
      goalId: "goal_123",
      reason: "Other",
      note: "Switching priorities",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      reason: "Other",
      note: "Switching priorities",
    });
  });

  it("should throw on invalid reason", async () => {
    await expect(
      gateway.pauseGoal({
        goalId: "goal_123",
        reason: "InvalidReason" as unknown as GoalPausedReasonsType,
      })
    ).rejects.toThrow("Invalid reason: InvalidReason");
  });

  it("should return defaults when view is not found", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_123" });
    mockGoalReader.findById.mockResolvedValue(null);

    const result = await gateway.pauseGoal({
      goalId: "goal_123",
      reason: "ContextCompressed",
    });

    expect(result).toEqual({
      goalId: "goal_123",
      objective: "",
      status: "paused",
      reason: "ContextCompressed",
    });
  });
});
