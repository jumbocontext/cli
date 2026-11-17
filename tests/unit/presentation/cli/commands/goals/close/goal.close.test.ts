/**
 * Tests for goal.close CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalClose } from "../../../../../../../src/presentation/cli/commands/goals/close/goal.close.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { GoalCloseDependencies } from "../../../../../../../src/presentation/cli/commands/goals/close/goal.close.js";

describe("goal.close command", () => {
  let mockCloseGoalController: { handle: jest.Mock };
  let mockContainer: Partial<GoalCloseDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockCloseGoalController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        goalId: "goal_123",
        status: "done",
        objective: "Implement authentication",
      }),
    };

    // Create mock container
    mockContainer = {
      closeGoalController: mockCloseGoalController as unknown as GoalCloseDependencies["closeGoalController"],
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

  it("should call closeGoalController.handle with goalId", async () => {
    await goalClose(
      { id: "goal_123" },
      mockContainer as GoalCloseDependencies
    );

    expect(mockCloseGoalController.handle).toHaveBeenCalledWith({
      goalId: "goal_123",
    });
  });

  it("should render success output", async () => {
    await goalClose(
      { id: "goal_123" },
      mockContainer as GoalCloseDependencies
    );

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    mockCloseGoalController.handle.mockRejectedValue(
      new Error("Cannot close goal in defined status. Goal must be in codifying status.")
    );

    await expect(
      goalClose({ id: "goal_123" }, mockContainer as GoalCloseDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Cannot close goal");
  });
});
