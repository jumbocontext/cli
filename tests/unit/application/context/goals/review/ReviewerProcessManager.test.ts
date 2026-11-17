import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { ReviewerProcessManager } from "../../../../../../src/application/context/goals/review/ReviewerProcessManager";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { ProcessManagerEvent } from "../../../../../../src/application/daemons/IProcessManager";

describe("ReviewerProcessManager", () => {
  const goal = {
    goalId: "goal_1",
    objective: "Review objective",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: GoalStatus.SUBMITTED,
  } as unknown as GoalView;
  let goalStatusReader: { findByStatus: jest.Mock; findAll: jest.Mock };
  let goalReader: { findById: jest.Mock };
  let claimPolicy: { canClaim: jest.Mock };
  let agentGateway: { invoke: jest.Mock };
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };

  beforeEach(() => {
    goalStatusReader = { findByStatus: jest.fn().mockResolvedValue([goal]), findAll: jest.fn() };
    goalReader = { findById: jest.fn().mockResolvedValue({ ...goal, status: GoalStatus.REJECTED }) };
    claimPolicy = { canClaim: jest.fn().mockReturnValue({ allowed: true }) };
    agentGateway = { invoke: jest.fn().mockResolvedValue({ exitCode: 0 }) };
    telemetryClient = { track: jest.fn(), flush: jest.fn(), shutdown: jest.fn() };
  });

  it("preserves legacy submitted-goal selection and review prompt semantics", async () => {
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({ agentId: "codex", maxRetries: 1 })).resolves.toEqual({
      status: "completed",
      goalId: "goal_1",
      attempts: 1,
    });
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.SUBMITTED);
    expect(agentGateway.invoke).toHaveBeenCalledWith(expect.objectContaining({
      agentId: "codex",
      prompt: expect.stringMatching(/jumbo goal review --id goal_1.*jumbo goal approve --id goal_1/s),
      onActivity: expect.any(Function),
    }));
    expect(agentGateway.invoke.mock.calls[0][0].prompt).toContain(
      'jumbo goal reject --id goal_1 --review-issues "describe the issues"',
    );
  });

  it("emits a structured waiting event when no goals are eligible", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([]);
    const emittedEvents: unknown[] = [];
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => emittedEvents.push(event),
    })).resolves.toEqual({ status: "idle", attempts: 0 });

    expect(emittedEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        daemon: "reviewer",
        status: "idle",
        source: "reviewer",
        category: "waiting",
        message: "awaiting submitted goals",
        phase: "idle",
      }),
      expect.objectContaining({
        daemon: "reviewer",
        status: "processing",
        category: "polling",
        phase: "polling",
      }),
    ]));
  });

  it("emits reviewer agent stdout lines as model-output events", async () => {
    const emittedEvents: unknown[] = [];
    agentGateway.invoke.mockResolvedValue({
      exitCode: 0,
      stdout: "Review found a missing assertion.\nRecommend changes before approval.\n",
    });
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      agentGateway,
      telemetryClient,
    );

    await manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => emittedEvents.push(event),
    });

    expect(emittedEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        daemon: "reviewer",
        status: "processing",
        source: "reviewer",
        category: "work-started",
        message: "reviewing goal",
        goalId: "goal_1",
        attempt: 1,
        maxRetries: 1,
        phase: "working",
      }),
      expect.objectContaining({
        daemon: "reviewer",
        status: "processing",
        source: "agent",
        category: "model-output",
        message: "Review found a missing assertion.",
        goalId: "goal_1",
      }),
      expect.objectContaining({
        daemon: "reviewer",
        status: "processing",
        source: "agent",
        category: "model-output",
        message: "Recommend changes before approval.",
        goalId: "goal_1",
      }),
      expect.objectContaining({
        daemon: "reviewer",
        status: "completed",
        source: "reviewer",
        category: "completed",
        message: "review completed",
        goalId: "goal_1",
        attempt: 1,
        maxRetries: 1,
        exitCode: 0,
        phase: "completed",
      }),
    ]));
  });

  it("caps reviewer model-output event messages from oversized agent stdout", async () => {
    const emittedEvents: ProcessManagerEvent[] = [];
    agentGateway.invoke.mockResolvedValue({
      exitCode: 0,
      stdout: `${"x".repeat(20_000)}review tail\n`,
    });
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      agentGateway,
      telemetryClient,
    );

    await manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => emittedEvents.push(event),
    });

    const modelOutputEvent = emittedEvents.find((event) => event.category === "model-output");
    expect(modelOutputEvent.message).toHaveLength(2_048);
    expect(modelOutputEvent.message).toContain("review tail");
  });
});
