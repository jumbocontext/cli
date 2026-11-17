import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { workResume } from "../../../../../../../src/presentation/cli/commands/work/resume/work.resume.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { GoalStatus } from "../../../../../../../src/domain/goals/Constants.js";

describe("work.resume command", () => {
  interface WorkResumeDependencies {
    readonly resumeWorkController: {
      handle: ReturnType<typeof jest.fn>;
    };
  }

  let mockContainer: WorkResumeDependencies;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockResumeResponse = {
    goalId: "goal_123",
    objective: "Resume objective",
    goalContextView: {
      goal: {
        goalId: "goal_123",
        objective: "Resume objective",
        successCriteria: ["Criterion 1"],
        scopeIn: ["src/application/context/work/resume/LocalResumeWorkGateway.ts"],
        scopeOut: [],
        status: GoalStatus.DOING,
        version: 3,
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-03T00:00:00Z",
        claimedBy: "worker_123",
        progress: ["Step 1 done"],
      },
      context: {
        components: [],
        dependencies: [],
        decisions: [],
        invariants: [],
        guidelines: [],
      },
    },
    context: {
      session: null,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
      },
      instructions: ["resume-continuation-prompt"],
      scope: "work-resume",
    },
  };

  beforeEach(() => {
    mockContainer = {
      resumeWorkController: {
        handle: jest.fn().mockResolvedValue(mockResumeResponse),
      },
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

  it("renders goal implementation instructions in text output", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await workResume(mockContainer);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Goal Implementation Instructions");
    expect(output).toContain("Objective");
    expect(output).toContain("jumbo goal submit --id goal_123");
  });

  it("includes resumedGoalContext in structured output", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await workResume(mockContainer);

    const jsonOutputs = consoleLogSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((line) => line.startsWith("{"));
    const parsed = jsonOutputs.map((line) => JSON.parse(line));

    expect(parsed.some((entry) => entry.resumedGoalContext?.goal?.goalId === "goal_123")).toBe(true);
  });

  it("does not exit when no paused goal exists", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    (mockContainer.resumeWorkController!.handle as jest.Mock).mockRejectedValue(
      new Error("No paused goal found for current worker")
    );

    await workResume(mockContainer);

    expect(processExitSpy).not.toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("No paused goal to resume");
  });
});
