/**
 * Tests for PauseWorkCommandHandler (work-level command handler)
 */

import { PauseWorkCommandHandler } from "../../../../../../src/application/context/work/pause/PauseWorkCommandHandler";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { IGoalStatusReader } from "../../../../../../src/application/context/goals/IGoalStatusReader";
import { PauseGoalCommandHandler } from "../../../../../../src/application/context/goals/pause/PauseGoalCommandHandler";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalPausedReasons } from "../../../../../../src/domain/goals/GoalPausedReasons";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { ILogger } from "../../../../../../src/application/logging/ILogger";
import { jest } from "@jest/globals";

describe("PauseWorkCommandHandler", () => {
  let workerIdentityReader: IWorkerIdentityReader;
  let goalStatusReader: IGoalStatusReader;
  let pauseGoalCommandHandler: PauseGoalCommandHandler;
  let logger: ILogger;
  let handler: PauseWorkCommandHandler;

  const workerId = createWorkerId("worker_123");

  beforeEach(() => {
    // Mock worker identity reader
    workerIdentityReader = {
      workerId,
    };

    // Mock goal status reader
    goalStatusReader = {
      findByStatus: jest.fn(),
      findAll: jest.fn(),
    };

    // Mock pause-goal handler
    pauseGoalCommandHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as PauseGoalCommandHandler;

    // Mock logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      flush: jest.fn(),
    } as unknown as ILogger;

    handler = new PauseWorkCommandHandler(
      workerIdentityReader,
      goalStatusReader,
      pauseGoalCommandHandler,
      logger
    );
  });

  it("should pause the active goal claimed by current worker", async () => {
    // Arrange
    const activeGoal: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([activeGoal]);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_123");
    expect(result.objective).toBe("Implement feature");
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.DOING);
    expect(pauseGoalCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      reason: GoalPausedReasons.WorkPaused,
    });
  });

  it("should throw error when no active goal found for worker", async () => {
    // Arrange - no goals in doing status
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No active goal found for current worker"
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[PauseWorkCommandHandler] No active goal found for worker",
      undefined,
      {
        workerId,
        doingGoalsCount: 0,
        allClaimedBy: [],
      }
    );
  });

  it("should throw error when doing goals exist but none claimed by current worker", async () => {
    // Arrange - goals exist but claimed by different worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_456",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No active goal found for current worker"
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[PauseWorkCommandHandler] No active goal found for worker",
      undefined,
      {
        workerId,
        doingGoalsCount: 1,
        allClaimedBy: ["other_worker_id"],
      }
    );
  });

  it("should select correct goal when multiple doing goals exist", async () => {
    // Arrange - multiple goals, only one claimed by current worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_other",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    const myGoal: GoalView = {
      goalId: "goal_mine",
      objective: "My active goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal, myGoal]);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_mine");
    expect(result.objective).toBe("My active goal");
  });

  it("should propagate errors from PauseGoalCommandHandler", async () => {
    // Arrange
    const activeGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([activeGoal]);
    (pauseGoalCommandHandler.execute as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow("Event store failure");
  });
});
