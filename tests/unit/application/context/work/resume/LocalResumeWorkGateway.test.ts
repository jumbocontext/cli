/**
 * Tests for LocalResumeWorkGateway
 */

import { LocalResumeWorkGateway } from "../../../../../../src/application/context/work/resume/LocalResumeWorkGateway";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { IGoalStatusReader } from "../../../../../../src/application/context/goals/IGoalStatusReader";
import { ResumeGoalCommandHandler } from "../../../../../../src/application/context/goals/resume/ResumeGoalCommandHandler";
import { SessionContextQueryHandler } from "../../../../../../src/application/context/sessions/get/SessionContextQueryHandler";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { ILogger } from "../../../../../../src/application/logging/ILogger";
import { ContextualSessionView } from "../../../../../../src/application/context/sessions/get/ContextualSessionView";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";
import { jest } from "@jest/globals";

describe("LocalResumeWorkGateway", () => {
  let workerIdentityReader: IWorkerIdentityReader;
  let goalStatusReader: IGoalStatusReader;
  let resumeGoalCommandHandler: jest.Mocked<Pick<ResumeGoalCommandHandler, "execute">>;
  let sessionContextQueryHandler: jest.Mocked<Pick<SessionContextQueryHandler, "execute">>;
  let logger: ILogger;
  let gateway: LocalResumeWorkGateway;

  const workerId = createWorkerId("worker_123");
  const resumedGoalContextView: ContextualGoalView = {
    goal: {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DOING,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
      claimedBy: workerId,
      progress: ["Investigated issue"],
    },
    context: {
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
    },
  };

  const baseContextualSessionView: ContextualSessionView = {
    session: null,
    context: {
      projectContext: null,
      activeGoals: [],
      pausedGoals: [],
      plannedGoals: [],
      recentDecisions: [],
    },
  };

  function createPausedGoal(overrides: Partial<GoalView> = {}): GoalView {
    return {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    workerIdentityReader = { workerId };

    goalStatusReader = {
      findByStatus: jest.fn().mockResolvedValue([]),
      findAll: jest.fn().mockResolvedValue([]),
    };

    resumeGoalCommandHandler = {
      execute: jest.fn().mockResolvedValue(resumedGoalContextView),
    };

    sessionContextQueryHandler = {
      execute: jest.fn().mockResolvedValue(baseContextualSessionView),
    };

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      flush: jest.fn(),
    } as unknown as ILogger;

    gateway = new LocalResumeWorkGateway(
      workerIdentityReader,
      goalStatusReader,
      resumeGoalCommandHandler as unknown as ResumeGoalCommandHandler,
      sessionContextQueryHandler as unknown as SessionContextQueryHandler,
      logger
    );
  });

  it("should resume the paused goal claimed by current worker", async () => {
    const pausedGoal = createPausedGoal();
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);

    const result = await gateway.resumeWork({});

    expect(result.goalId).toBe("goal_123");
    expect(result.objective).toBe("Implement feature");
    expect(result.goalContextView).toEqual(resumedGoalContextView);
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.PAUSED);
    expect(resumeGoalCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
  });

  it("should return enriched context with work-resume scope", async () => {
    const pausedGoal = createPausedGoal();
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);

    const result = await gateway.resumeWork({});

    expect(result.context).toBeDefined();
    expect(result.context.scope).toBe("work-resume");
    expect(result.context.instructions).toContain("resume-continuation-prompt");
  });

  it("should use objective from resumed contextual goal view", async () => {
    const pausedGoal = createPausedGoal({ objective: "Stale paused objective" });
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);
    (resumeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({
      ...resumedGoalContextView,
      goal: {
        ...resumedGoalContextView.goal,
        objective: "Fresh objective from goal context",
      },
    });

    const result = await gateway.resumeWork({});

    expect(result.objective).toBe("Fresh objective from goal context");
  });

  it("should include paused-goals-context instruction when paused goals exist in session context", async () => {
    const pausedGoal = createPausedGoal();
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);

    const contextWithPausedGoals: ContextualSessionView = {
      ...baseContextualSessionView,
      context: {
        ...baseContextualSessionView.context,
        pausedGoals: [pausedGoal],
      },
    };
    (sessionContextQueryHandler.execute as jest.Mock).mockResolvedValue(contextWithPausedGoals);

    const result = await gateway.resumeWork({});

    expect(result.context.instructions).toContain("paused-goals-context");
  });

  it("should not include paused-goals-context when no paused goals in session context", async () => {
    const pausedGoal = createPausedGoal();
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);

    const result = await gateway.resumeWork({});

    expect(result.context.instructions).not.toContain("paused-goals-context");
  });

  it("should throw error when no paused goal found for worker", async () => {
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([]);

    await expect(gateway.resumeWork({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should throw error when paused goals exist but none claimed by current worker", async () => {
    const otherWorkerGoal = createPausedGoal({
      goalId: "goal_456",
      objective: "Other worker's goal",
      claimedBy: "other_worker_id",
    });

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal]);

    await expect(gateway.resumeWork({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should select correct goal when multiple paused goals exist", async () => {
    const otherWorkerGoal = createPausedGoal({
      goalId: "goal_other",
      objective: "Other worker's goal",
      claimedBy: "other_worker_id",
    });

    const myGoal = createPausedGoal({
      goalId: "goal_mine",
      objective: "My paused goal",
    });

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal, myGoal]);
    (resumeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({
      ...resumedGoalContextView,
      goal: {
        ...resumedGoalContextView.goal,
        goalId: "goal_mine",
        objective: "My paused goal",
      },
    });

    const result = await gateway.resumeWork({});

    expect(result.goalId).toBe("goal_mine");
    expect(result.objective).toBe("My paused goal");
    expect(resumeGoalCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_mine" });
  });

  it("should propagate errors from ResumeGoalCommandHandler", async () => {
    const pausedGoal = createPausedGoal();
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);
    (resumeGoalCommandHandler.execute as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    await expect(gateway.resumeWork({})).rejects.toThrow("Event store failure");
  });

  it("should log error details when no paused goal found", async () => {
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([]);

    await expect(gateway.resumeWork({})).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      "[LocalResumeWorkGateway] No paused goal found for worker",
      undefined,
      expect.objectContaining({ workerId, pausedGoalsCount: 0 })
    );
  });
});
