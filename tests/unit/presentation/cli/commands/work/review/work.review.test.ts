import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("node:child_process", () => ({
  execSync: jest.fn(),
  spawn: jest.fn(),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js", () => ({
  runDaemonLoop: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/commands/work/shared/GoalStatusQuery.js", () => ({
  queryGoalStatus: jest.fn().mockReturnValue("unknown"),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/commands/work/shared/AgentSpawner.js", () => ({
  SUPPORTED_AGENTS: ["claude", "antigravity"],
  spawnAgent: jest.fn().mockResolvedValue(0),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/GlimmerEffect.js", () => ({
  playGlimmer: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/BrailleSpinner.js", () => ({
  startBrailleSpinner: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const { execSync } = await import("node:child_process");
const { workReview, registerWorkReviewCommand } = await import("../../../../../../../src/presentation/cli/commands/work/review/work.review.js");
const { runDaemonLoop } = await import("../../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js");
const { queryGoalStatus } = await import("../../../../../../../src/presentation/cli/commands/work/shared/GoalStatusQuery.js");
const { spawnAgent } = await import("../../../../../../../src/presentation/cli/commands/work/shared/AgentSpawner.js");
import type { DaemonCallbacks } from "../../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js";
import { Command } from "commander";

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockRunDaemonLoop = runDaemonLoop as jest.MockedFunction<typeof runDaemonLoop>;
const mockQueryGoalStatus = queryGoalStatus as jest.MockedFunction<typeof queryGoalStatus>;
const mockSpawnAgent = spawnAgent as jest.MockedFunction<typeof spawnAgent>;

describe("work.review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunDaemonLoop.mockResolvedValue(undefined);
  });

  describe("registration", () => {
    function register(): Command {
      const parent = new Command("work");
      registerWorkReviewCommand(parent);
      return parent.commands[0]!;
    }

    it("registers the review leaf under the work parent", () => {
      const command = register();
      expect(command.name()).toBe("review");
    });

    it("requires --agent option", () => {
      const command = register();
      const agentOption = command.options.find((o) => o.long === "--agent");
      expect(agentOption).toBeDefined();
      expect(agentOption!.required).toBe(true);
    });

    it("defaults poll interval and max retries", () => {
      const command = register();
      const pollOption = command.options.find((o) => o.long === "--poll-interval");
      const retriesOption = command.options.find((o) => o.long === "--max-retries");
      expect(pollOption!.defaultValue).toBe("30");
      expect(retriesOption!.defaultValue).toBe("3");
    });

    it("includes usage examples in help", () => {
      const command = register();
      const help = command.helpInformation();
      expect(help).toContain("jumbo work review --agent claude");
      expect(help).toContain("--poll-interval 60");
    });
  });

  describe("workReview", () => {
    it("exits with error for unknown agent", async () => {
      const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

      await expect(
        workReview({ agent: "badagent" }),
      ).rejects.toThrow("exit");

      mockExit.mockRestore();
    });

    it("calls runDaemonLoop with correct config", async () => {
      await workReview({ agent: "claude" });

      expect(mockRunDaemonLoop).toHaveBeenCalledWith(
        { agentId: "claude", pollIntervalS: 30, maxRetries: 3 },
        expect.any(Object),
        expect.objectContaining({
          queryGoals: expect.any(Function),
          spawnAgent: expect.any(Function),
          isGoalComplete: expect.any(Function),
          onGoalComplete: expect.any(Function),
          onGoalSkipped: expect.any(Function),
        }),
      );
    });

    it("respects custom poll interval and max retries", async () => {
      await workReview(
        { agent: "claude", pollInterval: "60", maxRetries: "5" },
      );

      expect(mockRunDaemonLoop).toHaveBeenCalledWith(
        { agentId: "claude", pollIntervalS: 60, maxRetries: 5 },
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe("callbacks", () => {
    let callbacks: DaemonCallbacks;

    beforeEach(async () => {
      await workReview({ agent: "claude" });
      callbacks = mockRunDaemonLoop.mock.calls[0][2];
    });

    describe("queryGoals", () => {
      it("queries for submitted goals sorted by createdAt ascending", () => {
        const goals = [
          { goalId: "goal-2", objective: "Second", createdAt: "2026-04-20T14:00:00.000Z" },
          { goalId: "goal-1", objective: "First", createdAt: "2026-04-20T13:00:00.000Z" },
        ];
        mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ goals })));

        const result = callbacks.queryGoals();

        expect(mockExecSync).toHaveBeenCalledWith(
          "npx jumbo goals list --status submitted",
          expect.any(Object),
        );
        expect(result[0].goalId).toBe("goal-1");
        expect(result[1].goalId).toBe("goal-2");
      });

      it("returns empty array on subprocess failure", () => {
        mockExecSync.mockImplementation(() => { throw new Error("fail"); });
        const result = callbacks.queryGoals();
        expect(result).toEqual([]);
      });
    });

    describe("spawnAgent", () => {
      it("spawns agent with review prompt", async () => {
        await callbacks.spawnAgent("test-goal-id");

        expect(mockSpawnAgent).toHaveBeenCalledWith(
          "claude",
          expect.stringContaining("Run the Jumbo review workflow for goal test-goal-id"),
        );
        expect(mockSpawnAgent).toHaveBeenCalledWith(
          "claude",
          expect.stringContaining("jumbo goal review --id test-goal-id"),
        );
      });
    });

    describe("isGoalComplete", () => {
      it("returns true when goal status is approved", () => {
        mockQueryGoalStatus.mockReturnValue("approved");
        expect(callbacks.isGoalComplete("goal-1")).toBe(true);
      });

      it("returns true when goal status is rejected", () => {
        mockQueryGoalStatus.mockReturnValue("rejected");
        expect(callbacks.isGoalComplete("goal-1")).toBe(true);
      });

      it("returns false when goal status is still submitted", () => {
        mockQueryGoalStatus.mockReturnValue("submitted");
        expect(callbacks.isGoalComplete("goal-1")).toBe(false);
      });

      it("returns false when goal status is unknown", () => {
        mockQueryGoalStatus.mockReturnValue("unknown");
        expect(callbacks.isGoalComplete("goal-1")).toBe(false);
      });
    });

    describe("onGoalComplete", () => {
      it("queries goal status for outcome rendering", () => {
        mockQueryGoalStatus.mockReturnValue("approved");
        callbacks.onGoalComplete("goal-1", "Test objective", 1);
        expect(mockQueryGoalStatus).toHaveBeenCalledWith("goal-1");
      });
    });

    describe("onGoalSkipped", () => {
      it("queries final goal status for skip rendering", () => {
        mockQueryGoalStatus.mockReturnValue("submitted");
        callbacks.onGoalSkipped("goal-1", "not-complete", 3);
        expect(mockQueryGoalStatus).toHaveBeenCalledWith("goal-1");
      });
    });
  });
});
