import { Goal } from "../../../../../src/domain/goals/Goal";
import { GoalId } from "../../../../../src/domain/goals/GoalId";
import { GoalEvent } from "../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("Goal.postpone", () => {
  it("emits and applies GoalPostponedEvent from defined", () => {
    const goal = Goal.create(GoalId.fromLegacy("goal_test"));
    goal.add("Test goal", "Test postponement", ["It works"]);

    const event = goal.postpone();

    expect(event).toEqual(expect.objectContaining({
      type: GoalEventType.POSTPONED,
      aggregateId: "goal_test",
      version: 2,
      payload: { status: GoalStatus.POSTPONED },
    }));
    expect(goal.snapshot.status).toBe(GoalStatus.POSTPONED);
    expect(goal.snapshot.version).toBe(2);
  });

  it("rejects a repeated postponement", () => {
    const goal = Goal.create(GoalId.fromLegacy("goal_test"));
    goal.add("Test goal", "Test postponement", ["It works"]);
    goal.postpone();

    expect(() => goal.postpone()).toThrow(
      "Cannot postpone goal in postponed status. Goal must be in defined status."
    );
  });

  it.each([...new Set(Object.values(GoalStatus))].filter((status) => status !== GoalStatus.TODO))(
    "rejects postponement from %s",
    (status) => {
      const goal = Goal.rehydrate("goal_test", [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_test",
          version: 1,
          timestamp: "2026-09-11T09:00:00.000Z",
          payload: {
            title: "Test goal",
            objective: "Test postponement",
            successCriteria: ["It works"],
            scopeIn: [],
            scopeOut: [],
            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.STATUS_MIGRATED,
          aggregateId: "goal_test",
          version: 2,
          timestamp: "2026-09-11T10:00:00.000Z",
          payload: {
            fromStatus: GoalStatus.TODO,
            toStatus: status,
            status,
            migratedAt: "2026-09-11T10:00:00.000Z",
          },
        },
      ] as GoalEvent[]);

      expect(() => goal.postpone()).toThrow(
        `Cannot postpone goal in ${status} status. Goal must be in defined status.`
      );
    }
  );
});
