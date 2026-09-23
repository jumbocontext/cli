import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { RefinerProcessManager } from "../../../../../src/application/context/goals/refine/RefinerProcessManager";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { RefineGoalController } from "../../../../../src/application/context/goals/refine/RefineGoalController";
import { ProcessManagerEvent } from "../../../../../src/application/daemons/IProcessManager";

describe("RefinerProcessManager", () => {
  const goal = {
    goalId: "goal_1",
    objective: "Refine objective",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: GoalStatus.TODO,
  } as unknown as GoalView;
  let goalStatusReader: { findByStatus: jest.Mock; findAll: jest.Mock };
  let goalReader: { findById: jest.Mock };
  let claimPolicy: { canClaim: jest.Mock };
  let refineGoalController: { handle: jest.Mock };
  let agentGateway: { invoke: jest.Mock };
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };

  beforeEach(() => {
    goalStatusReader = { findByStatus: jest.fn().mockResolvedValue([goal]), findAll: jest.fn() };
    goalReader = { findById: jest.fn().mockResolvedValue({ ...goal, status: GoalStatus.REFINED }) };
    claimPolicy = { canClaim: jest.fn().mockReturnValue({ allowed: true }) };
    refineGoalController = { handle: jest.fn().mockResolvedValue({}) };
    agentGateway = { invoke: jest.fn().mockResolvedValue({ exitCode: 0 }) };
    telemetryClient = { track: jest.fn(), flush: jest.fn(), shutdown: jest.fn() };
  });

  it("preserves legacy defined-goal selection and refinement prompt semantics", async () => {
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({ agentId: "codex", maxRetries: 1 })).resolves.toEqual({
      status: "completed",
      goalId: "goal_1",
      attempts: 1,
    });
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.TODO);
    expect(refineGoalController.handle).toHaveBeenCalledWith({ goalId: "goal_1" });
    expect(agentGateway.invoke).toHaveBeenCalledWith(expect.objectContaining({
      agentId: "codex",
      prompt: expect.stringContaining("jumbo goal commit --id goal_1"),
      onActivity: expect.any(Function),
    }));
  });

  it("selects only defined goals and never queries the postponed status", async () => {
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await manager.selectEligibleGoals();

    expect(goalStatusReader.findByStatus).toHaveBeenCalledTimes(1);
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.TODO);
    expect(goalStatusReader.findByStatus).not.toHaveBeenCalledWith(GoalStatus.POSTPONED);
  });

  it("emits a structured foraging event when no goals are eligible", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([]);
    const events: unknown[] = [];
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    })).resolves.toEqual({ status: "idle", attempts: 0 });

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        daemon: "refiner",
        status: "idle",
        source: "refiner",
        category: "foraging",
        message: "foraging for defined goals",
        phase: "idle",
      }),
    ]));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        daemon: "refiner",
        status: "processing",
        category: "polling",
        phase: "polling",
      }),
    ]));
  });

  it("emits a structured failure event when refinement cannot start", async () => {
    refineGoalController.handle.mockRejectedValue(new Error("Goal is claimed by another worker"));
    const events: unknown[] = [];
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    })).resolves.toEqual({ status: "failed", goalId: "goal_1", attempts: 0 });

    expect(events).toContainEqual(expect.objectContaining({
      daemon: "refiner",
      status: "failed",
      source: "refiner",
      category: "failed",
      message: "refinement failed",
      goalId: "goal_1",
      errorType: "Error",
      errorMessage: "Goal is claimed by another worker",
    }));
  });

  it("includes agent stderr in skipped and exhausted events when invocation fails", async () => {
    goalReader.findById.mockResolvedValue({ ...goal, status: GoalStatus.TODO });
    agentGateway.invoke.mockResolvedValue({
      exitCode: 1,
      stderr: "Error loading configuration: config profile `prompt` not found\n",
    });
    const events: ProcessManagerEvent[] = [];
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({
      agentId: "codex",
      maxRetries: 2,
      emit: (event) => events.push(event),
    })).resolves.toEqual({
      status: "exhausted",
      goalId: "goal_1",
      attempts: 2,
    });

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        status: "processing",
        source: "refiner",
        category: "work-started",
        message: "refining goal",
        attempt: 1,
        phase: "working",
      }),
      expect.objectContaining({
        status: "skipped",
        source: "refiner",
        category: "skipped",
        message: "goal not refined after agent attempt",
        attempt: 1,
        phase: "retry",
        errorMessage: "Error loading configuration: config profile `prompt` not found",
      }),
      expect.objectContaining({
        status: "processing",
        category: "retry",
        message: "retrying refinement",
        attempt: 1,
      }),
      expect.objectContaining({
        status: "processing",
        source: "refiner",
        category: "work-started",
        message: "refining goal",
        attempt: 2,
        phase: "working",
      }),
      expect.objectContaining({
        status: "exhausted",
        source: "refiner",
        category: "exhausted",
        message: "refinement attempts exhausted",
        attempt: 2,
        phase: "exhausted",
        errorMessage: "Error loading configuration: config profile `prompt` not found",
      }),
    ]));
  });

  it("caps agent stderr in skipped and exhausted event error messages", async () => {
    goalReader.findById.mockResolvedValue({ ...goal, status: GoalStatus.TODO });
    agentGateway.invoke.mockResolvedValue({
      exitCode: 1,
      stderr: `${"x".repeat(20_000)}refiner tail\n`,
    });
    const events: ProcessManagerEvent[] = [];
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_1" },
      refineGoalController as unknown as RefineGoalController,
      agentGateway,
      telemetryClient,
    );

    await manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    });

    const exhaustedEvent = events.find((event) => event.status === "exhausted");
    expect(exhaustedEvent.errorMessage).toHaveLength(2_048);
    expect(exhaustedEvent.errorMessage).toContain("refiner tail");
  });
});
