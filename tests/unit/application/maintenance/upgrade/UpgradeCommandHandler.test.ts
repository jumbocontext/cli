import { UpgradeCommandHandler } from "../../../../../src/application/maintenance/upgrade/UpgradeCommandHandler";
import { IEventStore } from "../../../../../src/application/persistence/IEventStore";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { GoalEventType } from "../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("UpgradeCommandHandler", () => {
  let eventStore: jest.Mocked<IEventStore>;
  let goalStatusReader: jest.Mocked<IGoalStatusReader>;
  let handler: UpgradeCommandHandler;

  beforeEach(() => {
    eventStore = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
      readStream: jest.fn().mockResolvedValue([]),
      getAllEvents: jest.fn().mockResolvedValue([]),
    };
    goalStatusReader = {
      findByStatus: jest.fn().mockResolvedValue([]),
      findAll: jest.fn().mockResolvedValue([]),
    };
    handler = new UpgradeCommandHandler(eventStore, goalStatusReader);
  });

  it("should migrate goals with legacy 'to-do' status", async () => {
    const legacyGoal = makeGoalView("goal_1", "to-do");
    goalStatusReader.findAll.mockResolvedValue([legacyGoal]);
    eventStore.readStream.mockResolvedValue([
      { type: "GoalAddedEvent", aggregateId: "goal_1", version: 1, timestamp: "2025-01-01T00:00:00Z" },
    ]);

    const result = await handler.handle({ from: "v1", to: "v2" });

    expect(result.migratedGoals).toBe(1);
    expect(result.eventsAppended).toBe(1);
    expect(result.success).toBe(true);
    expect(eventStore.append).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GoalEventType.STATUS_MIGRATED,
        aggregateId: "goal_1",
        version: 2,
        payload: expect.objectContaining({
          fromStatus: "to-do",
          toStatus: "defined",
          status: "defined",
        }),
      })
    );
  });

  it("should migrate goals with legacy 'qualified' status", async () => {
    const legacyGoal = makeGoalView("goal_2", "qualified");
    goalStatusReader.findAll.mockResolvedValue([legacyGoal]);
    eventStore.readStream.mockResolvedValue([
      { type: "GoalAddedEvent", aggregateId: "goal_2", version: 1, timestamp: "2025-01-01T00:00:00Z" },
      { type: "GoalQualifiedEvent", aggregateId: "goal_2", version: 5, timestamp: "2025-01-02T00:00:00Z" },
    ]);

    const result = await handler.handle({ from: "v1", to: "v2" });

    expect(result.migratedGoals).toBe(1);
    expect(eventStore.append).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 6,
        payload: expect.objectContaining({
          fromStatus: "qualified",
          toStatus: "approved",
          status: "approved",
        }),
      })
    );
  });

  it("should migrate goals with legacy 'completed' status", async () => {
    const legacyGoal = makeGoalView("goal_3", "completed");
    goalStatusReader.findAll.mockResolvedValue([legacyGoal]);
    eventStore.readStream.mockResolvedValue([
      { type: "GoalAddedEvent", aggregateId: "goal_3", version: 1, timestamp: "2025-01-01T00:00:00Z" },
    ]);

    const result = await handler.handle({ from: "v1", to: "v2" });

    expect(result.migratedGoals).toBe(1);
    expect(eventStore.append).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          fromStatus: "completed",
          toStatus: "done",
          status: "done",
        }),
      })
    );
  });

  it("should be idempotent — no migration when no legacy statuses exist", async () => {
    const modernGoal = makeGoalView("goal_4", "defined");
    goalStatusReader.findAll.mockResolvedValue([modernGoal]);

    const result = await handler.handle({ from: "v1", to: "v2" });

    expect(result.migratedGoals).toBe(0);
    expect(result.eventsAppended).toBe(0);
    expect(result.success).toBe(true);
    expect(eventStore.append).not.toHaveBeenCalled();
  });

  it("should migrate multiple goals in a single run", async () => {
    goalStatusReader.findAll.mockResolvedValue([
      makeGoalView("goal_a", "to-do"),
      makeGoalView("goal_b", "qualified"),
      makeGoalView("goal_c", "doing"),
    ]);
    eventStore.readStream.mockResolvedValue([
      { type: "GoalAddedEvent", aggregateId: "any", version: 1, timestamp: "2025-01-01T00:00:00Z" },
    ]);

    const result = await handler.handle({ from: "v1", to: "v2" });

    expect(result.migratedGoals).toBe(2);
    expect(result.eventsAppended).toBe(2);
    expect(eventStore.append).toHaveBeenCalledTimes(2);
  });

  it("should reject unsupported upgrade path", async () => {
    await expect(handler.handle({ from: "v2", to: "v3" })).rejects.toThrow(
      "Unsupported upgrade path"
    );
  });
});

function makeGoalView(goalId: string, status: string): GoalView {
  return {
    goalId,
    title: "Test",
    objective: "Test objective",
    successCriteria: [],
    scopeIn: [],
    scopeOut: [],
    status: status as unknown as GoalView["status"],
    version: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    progress: [],
  };
}
