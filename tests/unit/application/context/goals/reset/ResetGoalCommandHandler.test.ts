/**
 * Tests for ResetGoalCommandHandler (command handler)
 */

import { ResetGoalCommandHandler } from "../../../../../../src/application/context/goals/reset/ResetGoalCommandHandler";
import { ResetGoalCommand } from "../../../../../../src/application/context/goals/reset/ResetGoalCommand";
import { IGoalResetEventWriter } from "../../../../../../src/application/context/goals/reset/IGoalResetEventWriter";
import { IGoalResetEventReader } from "../../../../../../src/application/context/goals/reset/IGoalResetEventReader";
import { IGoalResetReader } from "../../../../../../src/application/context/goals/reset/IGoalResetReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { jest } from "@jest/globals";

describe("ResetGoalCommandHandler", () => {
  let eventWriter: IGoalResetEventWriter;
  let eventReader: IGoalResetEventReader;
  let goalReader: IGoalResetReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let handler: ResetGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 5 }),
    };

    eventReader = {
      readStream: jest.fn(),
    };

    goalReader = {
      findById: jest.fn(),
    };

    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    claimStore = {
      getClaim: jest.fn().mockReturnValue(null),
      setClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    clock = {
      nowIso: jest.fn().mockReturnValue("2025-01-15T10:00:00.000Z"),
    };

    claimPolicy = new GoalClaimPolicy(claimStore, clock);

    workerIdentityReader = {
      workerId: testWorkerId,
    };

    handler = new ResetGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader
    );
  });

  it("should reset a DOING goal to REFINED, persist GoalResetEvent, release claim, and publish event", async () => {
    const command: ResetGoalCommand = { goalId: "goal_123" };

    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DOING,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock claim owned by current worker
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: testWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z",
    });

    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Auth feature",
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINEMENT_STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.IN_REFINEMENT },
      },
      {
        type: GoalEventType.COMMITTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    const result = await handler.execute(command);

    expect(result.goalId).toBe("goal_123");

    // Verify event was appended
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.RESET);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(5);
    expect(appendedEvent.payload.status).toBe(GoalStatus.REFINED);

    // Verify claim was released
    expect(claimStore.releaseClaim).toHaveBeenCalledWith("goal_123");

    // Verify event was published
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.RESET);
  });

  it("should reset a CODIFYING goal to APPROVED", async () => {
    const command: ResetGoalCommand = { goalId: "goal_123" };

    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.CODIFYING,
      version: 8,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test goal",
          objective: "Test goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINEMENT_STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.IN_REFINEMENT },
      },
      {
        type: GoalEventType.COMMITTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: { status: GoalStatus.SUBMITTED, submittedAt: "2025-01-01T04:00:00Z" },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 6,
        timestamp: "2025-01-01T05:00:00Z",
        payload: { status: GoalStatus.INREVIEW, submittedAt: "2025-01-01T05:00:00Z" },
      },
      {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_123",
        version: 7,
        timestamp: "2025-01-01T06:00:00Z",
        payload: { status: GoalStatus.QUALIFIED, qualifiedAt: "2025-01-01T06:00:00Z" },
      },
      {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_123",
        version: 8,
        timestamp: "2025-01-01T07:00:00Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2025-01-01T07:00:00Z",
          claimedBy: testWorkerId,
          claimedAt: "2025-01-01T07:00:00Z",
          claimExpiresAt: "2025-01-01T09:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    const result = await handler.execute(command);

    expect(result.goalId).toBe("goal_123");
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.status).toBe(GoalStatus.QUALIFIED);
  });

  it("should throw error if goal not found", async () => {
    const command: ResetGoalCommand = { goalId: "nonexistent" };
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    const command: ResetGoalCommand = { goalId: "goal_123" };

    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DOING,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z",
    });

    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw error when resetting from a waiting state", async () => {
    const command: ResetGoalCommand = { goalId: "goal_123" };

    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test goal",
          objective: "Test goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot reset goal. Goal is already in waiting state"
    );
  });
});
