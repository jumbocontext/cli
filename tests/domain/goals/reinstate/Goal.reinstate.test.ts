import { Goal } from "../../../../src/domain/goals/Goal";
import { GoalId } from "../../../../src/domain/goals/GoalId";
import { GoalEvent } from "../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";

describe("Goal.reinstate", () => {
  it("emits and applies GoalReinstatedEvent from postponed", () => {
    const goal = Goal.create(GoalId.fromLegacy("goal_test"));
    goal.add("Test goal", "Test reinstatement", ["It works"]);
    goal.postpone();

    const event = goal.reinstate();

    expect(event).toEqual(expect.objectContaining({
      type: GoalEventType.REINSTATED,
      aggregateId: "goal_test",
      version: 3,
      payload: { status: GoalStatus.TODO },
    }));
    expect(goal.snapshot.status).toBe(GoalStatus.TODO);
    expect(goal.snapshot.version).toBe(3);
  });

  it("rejects a repeated reinstatement", () => {
    const goal = Goal.create(GoalId.fromLegacy("goal_test"));
    goal.add("Test goal", "Test reinstatement", ["It works"]);
    goal.postpone();
    goal.reinstate();

    expect(() => goal.reinstate()).toThrow(
      "Cannot reinstate goal in defined status. Goal must be in postponed status."
    );
  });

  it.each([...new Set(Object.values(GoalStatus))].filter((status) => status !== GoalStatus.POSTPONED))(
    "rejects reinstatement from %s",
    (status) => {
      const goal = Goal.rehydrate("goal_test", [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_test",
          version: 1,
          timestamp: "2026-09-11T09:00:00.000Z",
          payload: {
            title: "Test goal",
            objective: "Test reinstatement",
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

      expect(() => goal.reinstate()).toThrow(
        `Cannot reinstate goal in ${status} status. Goal must be in postponed status.`
      );
    }
  );
});
