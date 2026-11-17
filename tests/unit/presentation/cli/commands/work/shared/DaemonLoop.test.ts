import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { runDaemonLoop } from "../../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js";
import type { DaemonConfig, DaemonCallbacks, GoalEntry } from "../../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js";
import type { DaemonDisplay } from "../../../../../../../src/presentation/cli/commands/work/shared/DaemonDisplay.js";

describe("DaemonLoop", () => {
  const mockStop = jest.fn();
  const mockDisplay = {
    renderHeader: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    startWaiting: jest.fn().mockReturnValue({ stop: mockStop }),
    startProcessing: jest.fn().mockReturnValue({ stop: mockStop }),
    renderGoalStart: jest.fn(),
    renderGoalComplete: jest.fn(),
    renderGoalSkipped: jest.fn(),
    renderShutdown: jest.fn(),
    renderUnknownAgent: jest.fn(),
  };

  const baseConfig: DaemonConfig = {
    agentId: "claude",
    pollIntervalS: 0,
    maxRetries: 3,
  };

  let originalStdinIsTTY: boolean | undefined;
  let signalHandlers: Record<string, ((...args: unknown[]) => void)[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisplay.startWaiting.mockReturnValue({ stop: mockStop });
    mockDisplay.startProcessing.mockReturnValue({ stop: mockStop });
    originalStdinIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });

    signalHandlers = {};
    jest.spyOn(process, "on").mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      if (!signalHandlers[event]) signalHandlers[event] = [];
      signalHandlers[event].push(handler);
      return process;
    });
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: originalStdinIsTTY, configurable: true });
    jest.restoreAllMocks();
  });

  function triggerShutdown(): void {
    const handlers = signalHandlers["SIGINT"] ?? [];
    for (const h of handlers) h();
  }

  it("renders header on start", async () => {
    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop(baseConfig, mockDisplay as unknown as DaemonDisplay, callbacks);
    expect(mockDisplay.renderHeader).toHaveBeenCalledTimes(1);
  });

  it("processes a goal and calls onGoalComplete when isGoalComplete returns true", async () => {
    let goalServed = false;
    const goal: GoalEntry = { goalId: "test-goal-id", objective: "Test objective" };

    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        if (!goalServed) {
          goalServed = true;
          return [goal];
        }
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(true),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop(baseConfig, mockDisplay as unknown as DaemonDisplay, callbacks);

    expect(mockDisplay.renderGoalStart).toHaveBeenCalledWith("test-goal-id", "Test objective", 1, 3);
    expect(mockDisplay.startProcessing).toHaveBeenCalled();
    expect(callbacks.spawnAgent).toHaveBeenCalledWith("test-goal-id");
    expect(callbacks.onGoalComplete).toHaveBeenCalledWith("test-goal-id", "Test objective", 1);
  });

  it("retries and calls onGoalSkipped when max retries exhausted", async () => {
    let goalServed = false;
    const goal: GoalEntry = { goalId: "retry-goal", objective: "Retry objective" };

    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        if (!goalServed) {
          goalServed = true;
          return [goal];
        }
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(1),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop({ ...baseConfig, maxRetries: 2 }, mockDisplay as unknown as DaemonDisplay, callbacks);

    expect(callbacks.spawnAgent).toHaveBeenCalledTimes(2);
    expect(callbacks.onGoalSkipped).toHaveBeenCalledWith("retry-goal", "not-complete", 2);
    expect(callbacks.onGoalComplete).not.toHaveBeenCalled();
  });

  it("does not reprocess exhausted goals", async () => {
    let pollCount = 0;
    const goal: GoalEntry = { goalId: "exhausted-goal", objective: "Will exhaust" };

    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        pollCount++;
        if (pollCount <= 2) return [goal];
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(1),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop({ ...baseConfig, maxRetries: 1 }, mockDisplay as unknown as DaemonDisplay, callbacks);

    // Goal spawned once (1 max retry), second poll filters it out
    expect(callbacks.spawnAgent).toHaveBeenCalledTimes(1);
  });

  it("starts waiting spinner when no goals available", async () => {
    let pollCount = 0;

    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        pollCount++;
        if (pollCount >= 2) triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop(baseConfig, mockDisplay as unknown as DaemonDisplay, callbacks);

    expect(mockDisplay.startWaiting).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
  });

  it("renders shutdown message on exit", async () => {
    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop(baseConfig, mockDisplay as unknown as DaemonDisplay, callbacks);

    expect(mockDisplay.renderShutdown).toHaveBeenCalledTimes(1);
  });

  it("registers SIGINT and SIGTERM handlers", async () => {
    const callbacks: DaemonCallbacks = {
      queryGoals: () => {
        triggerShutdown();
        return [];
      },
      spawnAgent: jest.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
      isGoalComplete: jest.fn<(goalId: string) => boolean>().mockReturnValue(false),
      onGoalComplete: jest.fn(),
      onGoalSkipped: jest.fn(),
    };

    await runDaemonLoop(baseConfig, mockDisplay as unknown as DaemonDisplay, callbacks);

    expect(signalHandlers["SIGINT"]).toBeDefined();
    expect(signalHandlers["SIGTERM"]).toBeDefined();
  });
});
