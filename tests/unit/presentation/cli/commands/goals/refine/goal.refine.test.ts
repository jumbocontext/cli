/**
 * Tests for goal.refine CLI command
 *
 * Tests the two-mode behavior:
 * 1. Default mode (no flags): Display goal details + LLM prompt + transition to in-refinement status
 * 2. --interactive mode: Interactive relation flow + transition to in-refinement status
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalRefine } from "../../../../../../../src/presentation/cli/commands/goals/refine/goal.refine.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { GoalStatus } from "../../../../../../../src/domain/goals/Constants.js";
import { IGoalReader } from "../../../../../../../src/application/context/goals/start/IGoalReader.js";
import type { GoalRefineDependencies } from "../../../../../../../src/presentation/cli/commands/goals/refine/goal.refine.js";

/**
 * Mock implementations for test dependencies
 */

class MockGoalContextReader implements IGoalReader {
  mockFindById: jest.Mock<(goalId: string) => Promise<GoalView | null>> = jest.fn();

  async findById(goalId: string): Promise<GoalView | null> {
    return this.mockFindById(goalId);
  }
}

describe("goal.refine command", () => {
  let mockGoalContextReader: MockGoalContextReader;
  let mockRefineGoalController: { handle: jest.Mock };
  let mockContainer: Partial<GoalRefineDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockTodoGoalView: GoalView = {
    goalId: "goal_123",
    objective: "Implement user authentication",
    successCriteria: ["Users can log in", "Sessions are persisted"],
    scopeIn: ["Login form", "Session management"],
    scopeOut: ["Password reset", "Social login"],

    status: GoalStatus.TODO,
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
    progress: [],
  };

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockGoalContextReader = new MockGoalContextReader();
    mockRefineGoalController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        goalId: "goal_123",
        status: GoalStatus.IN_REFINEMENT,
      }),
    };

    // Create mock container
    mockContainer = {
      goalContextReader: mockGoalContextReader,
      refineGoalController: mockRefineGoalController as unknown as GoalRefineDependencies["refineGoalController"],
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

  describe("default mode (no flags)", () => {
    it("should display goal details and transition to in-refinement", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      // Verify goal was fetched
      expect(mockGoalContextReader.mockFindById).toHaveBeenCalledWith("goal_123");

      // Verify controller was called (state transition happens)
      expect(mockRefineGoalController.handle).toHaveBeenCalledWith({ goalId: "goal_123" });

      // Verify output includes goal details and LLM instructions
      expect(consoleLogSpy).toHaveBeenCalled();
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Id:");
      expect(allOutput).toContain("goal_123");
      expect(allOutput).toContain("@LLM:");
    });

    it("should display success criteria when present", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Success Criteria");
      expect(allOutput).toContain("Users can log in");
    });

    it("should display scope in and scope out when present", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Scope: In");
      expect(allOutput).toContain("Login form");
      expect(allOutput).toContain("Scope: Out");
      expect(allOutput).toContain("Password reset");
    });

    it("should display LLM refinement prompt with entity exploration commands", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("jumbo invariants list");
      expect(allOutput).toContain("jumbo guidelines list");
      expect(allOutput).toContain("jumbo decisions list");
      expect(allOutput).toContain("jumbo components list");
    });

    it("should display success message after transition", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("refinement started");
    });
  });

  describe("error handling", () => {
    it("should exit with error when goal not found", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(null);

      await expect(
        goalRefine({ id: "nonexistent" }, mockContainer as GoalRefineDependencies)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Goal not found");
    });

    it("should exit with error when controller fails", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);
      mockRefineGoalController.handle.mockRejectedValue(new Error("Goal cannot be refined"));

      await expect(
        goalRefine({ id: "goal_123" }, mockContainer as GoalRefineDependencies)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Failed to refine goal");
    });

    it("should handle goal already in refinement status", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue({
        ...mockTodoGoalView,
        status: GoalStatus.IN_REFINEMENT,
      });
      mockRefineGoalController.handle.mockRejectedValue(
        new Error("Goal is already in refinement.")
      );

      await expect(
        goalRefine({ id: "goal_123" }, mockContainer as GoalRefineDependencies)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Failed to refine goal");
    });
  });

  describe("goal without optional fields", () => {
    it("should handle goal with empty successCriteria", async () => {
      const goalWithoutCriteria: GoalView = {
        ...mockTodoGoalView,
        successCriteria: [],
      };
      mockGoalContextReader.mockFindById.mockResolvedValue(goalWithoutCriteria);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      // Should not throw and should still display goal details
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Id:");
    });

    it("should handle goal with empty scopeIn and scopeOut", async () => {
      const goalWithoutScope: GoalView = {
        ...mockTodoGoalView,
        scopeIn: [],
        scopeOut: [],
      };
      mockGoalContextReader.mockFindById.mockResolvedValue(goalWithoutScope);

      await goalRefine(
        { id: "goal_123" },
        mockContainer as GoalRefineDependencies
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Id:");
      // Scope sections should not appear when empty
      expect(allOutput).not.toContain("Scope: In");
      expect(allOutput).not.toContain("Scope: Out");
    });
  });
});
