import { Goal } from "../../../../src/domain/goals/Goal";
import { GoalEventType, GoalStatus } from "../../../../src/domain/goals/Constants";
import { createWorkerId } from "../../../../src/application/host/workers/WorkerId";
import type { GoalEvent } from "../../../../src/domain/goals/EventIndex";

describe("Goal.codify", () => {
  const testWorkerId = createWorkerId("test-worker-id");

  const buildQualifiedHistory = (goalId: string): GoalEvent[] => [
    {
      type: GoalEventType.ADDED,
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T00:00:00Z",
      payload: {
        title: "Test Goal",
        objective: "Implement feature",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        status: GoalStatus.TODO,
      },
    },
    {
      type: GoalEventType.REFINEMENT_STARTED,
      aggregateId: goalId,
      version: 2,
      timestamp: "2025-01-01T01:00:00Z",
      payload: {
        status: GoalStatus.IN_REFINEMENT,
        refinementStartedAt: "2025-01-01T01:00:00Z",
        claimedBy: testWorkerId,
        claimedAt: "2025-01-01T01:00:00Z",
        claimExpiresAt: "2025-01-01T03:00:00Z",
      },
    },
    {
      type: GoalEventType.COMMITTED,
      aggregateId: goalId,
      version: 3,
      timestamp: "2025-01-01T02:00:00Z",
      payload: {
        status: GoalStatus.REFINED,
        committedAt: "2025-01-01T02:00:00Z",
      },
    },
    {
      type: GoalEventType.STARTED,
      aggregateId: goalId,
      version: 4,
      timestamp: "2025-01-01T03:00:00Z",
      payload: {
        status: GoalStatus.DOING,
        claimedBy: testWorkerId,
        claimedAt: "2025-01-01T03:00:00Z",
        claimExpiresAt: "2025-01-01T05:00:00Z",
      },
    },
    {
      type: GoalEventType.SUBMITTED,
      aggregateId: goalId,
      version: 5,
      timestamp: "2025-01-01T04:00:00Z",
      payload: {
        status: GoalStatus.SUBMITTED,
        submittedAt: "2025-01-01T04:00:00Z",
      },
    },
    {
      type: GoalEventType.SUBMITTED_FOR_REVIEW,
      aggregateId: goalId,
      version: 6,
      timestamp: "2025-01-01T05:00:00Z",
      payload: {
        status: GoalStatus.INREVIEW,
        submittedAt: "2025-01-01T05:00:00Z",
        claimedBy: testWorkerId,
        claimedAt: "2025-01-01T05:00:00Z",
        claimExpiresAt: "2025-01-01T07:00:00Z",
      },
    },
    {
      type: GoalEventType.QUALIFIED,
      aggregateId: goalId,
      version: 7,
      timestamp: "2025-01-01T06:00:00Z",
      payload: {
        status: GoalStatus.QUALIFIED,
        qualifiedAt: "2025-01-01T06:00:00Z",
      },
    },
  ];

  it("should produce GoalCodifyingStartedEvent from QUALIFIED status", () => {
    const goalId = "goal_123";
    const goal = Goal.rehydrate(goalId, buildQualifiedHistory(goalId));

    const claimInfo = {
      claimedBy: testWorkerId,
      claimedAt: "2025-01-01T07:00:00Z",
      claimExpiresAt: "2025-01-01T09:00:00Z",
    };

    const event = goal.codify(claimInfo);

    expect(event.type).toBe(GoalEventType.CODIFYING_STARTED);
    expect(event.aggregateId).toBe(goalId);
    expect(event.version).toBe(8);
    expect(event.payload.status).toBe(GoalStatus.CODIFYING);
    expect(event.payload.codifyStartedAt).toBeDefined();
    expect(event.payload.claimedBy).toBe(testWorkerId);
    expect(event.payload.claimedAt).toBe("2025-01-01T07:00:00Z");
    expect(event.payload.claimExpiresAt).toBe("2025-01-01T09:00:00Z");
  });

  it("should throw when codifying from non-QUALIFIED status (TODO)", () => {
    const goalId = "goal_456";
    const history: GoalEvent[] = [
      {
        type: GoalEventType.ADDED,
        aggregateId: goalId,
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test Goal",
          objective: "Implement feature",
          successCriteria: ["Criterion 1"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
    ];

    const goal = Goal.rehydrate(goalId, history);

    expect(() =>
      goal.codify({
        claimedBy: testWorkerId,
        claimedAt: "2025-01-01T07:00:00Z",
        claimExpiresAt: "2025-01-01T09:00:00Z",
      })
    ).toThrow("Cannot codify goal in defined status");
  });
});
