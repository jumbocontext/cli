/**
 * Tests for goal.commit CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalCommit } from "../../../../../../../src/presentation/cli/commands/goals/commit/goal.commit.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { GoalStatus } from "../../../../../../../src/domain/goals/Constants.js";
import type { GoalCommitDependencies } from "../../../../../../../src/presentation/cli/commands/goals/commit/goal.commit.js";

describe("goal.commit command", () => {
  let mockCommitGoalController: { handle: jest.Mock };
  let mockContainer: Partial<GoalCommitDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockCommitGoalController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        goalId: "goal_123",
        status: GoalStatus.REFINED,
      }),
    };

    // Create mock container
    mockContainer = {
      commitGoalController: mockCommitGoalController as unknown as GoalCommitDependencies["commitGoalController"],
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("should call commitGoalController.handle with goalId", async () => {
    await goalCommit(
      { id: "goal_123" },
      mockContainer as GoalCommitDependencies
    );

    expect(mockCommitGoalController.handle).toHaveBeenCalledWith({
      goalId: "goal_123",
    });
  });

  it("should render success output", async () => {
    await goalCommit(
      { id: "goal_123" },
      mockContainer as GoalCommitDependencies
    );

    expect(consoleLogSpy).toHaveBeenCalled();
    const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(allOutput).toContain("goal_123");
  });

  it("should handle errors", async () => {
    mockCommitGoalController.handle.mockRejectedValue(
      new Error("Cannot commit goal in defined status. Goal must be in in-refinement status.")
    );

    await expect(
      goalCommit({ id: "goal_123" }, mockContainer as GoalCommitDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    // Error messages go to console.error
    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Cannot commit goal");
  });
});
