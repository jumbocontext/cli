/**
 * Tests for goal.approve CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalApprove } from "../../../../../../../src/presentation/cli/commands/goals/approve/goal.approve.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { GoalApproveDependencies } from "../../../../../../../src/presentation/cli/commands/goals/approve/goal.approve.js";

describe("goal.approve command", () => {
  let mockQualifyGoalController: { handle: jest.Mock };
  let mockContainer: Partial<GoalApproveDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockQualifyGoalController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        goalId: "goal_123",
        status: "approved",
        objective: "Implement authentication",
      }),
    };

    // Create mock container
    mockContainer = {
      qualifyGoalController: mockQualifyGoalController as unknown as GoalApproveDependencies["qualifyGoalController"],
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

  it("should call qualifyGoalController.handle with goalId", async () => {
    await goalApprove(
      { id: "goal_123" },
      mockContainer as GoalApproveDependencies
    );

    expect(mockQualifyGoalController.handle).toHaveBeenCalledWith({
      goalId: "goal_123",
    });
  });

  it("should render success output with Goal Approved", async () => {
    await goalApprove(
      { id: "goal_123" },
      mockContainer as GoalApproveDependencies
    );

    expect(consoleLogSpy).toHaveBeenCalled();
    const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(allOutput).toContain("Goal Approved");
    expect(allOutput).toContain("goal_123");
  });

  it("should handle errors", async () => {
    mockQualifyGoalController.handle.mockRejectedValue(
      new Error("Cannot approve goal in defined status. Goal must be in in-review status.")
    );

    await expect(
      goalApprove({ id: "goal_123" }, mockContainer as GoalApproveDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Cannot approve goal");
  });
});
