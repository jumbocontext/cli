/**
 * Tests for RejectGoalCommandHandler (command handler)
 */

import { RejectGoalCommandHandler } from "../../../../../../src/application/context/goals/reject/RejectGoalCommandHandler";
import { RejectGoalCommand } from "../../../../../../src/application/context/goals/reject/RejectGoalCommand";
import { IGoalRejectedEventWriter } from "../../../../../../src/application/context/goals/reject/IGoalRejectedEventWriter";
import { IGoalRejectedEventReader } from "../../../../../../src/application/context/goals/reject/IGoalRejectedEventReader";
import { IGoalRejectReader } from "../../../../../../src/application/context/goals/reject/IGoalRejectReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { jest } from "@jest/globals";

describe("RejectGoalCommandHandler", () => {
  let eventWriter: IGoalRejectedEventWriter;
  let eventReader: IGoalRejectedEventReader;
  let goalReader: IGoalRejectReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: RejectGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
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

    goalContextQueryHandler = {
      execute: jest.fn(),
    } as unknown as GoalContextQueryHandler;

    handler = new RejectGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
  });

  it("should reject goal from in-review status and publish GoalRejectedEvent", async () => {
    const command: RejectGoalCommand = {
      goalId: "goal_123",
      reviewIssues: "Missing error handling in API endpoint",
    };

    const mockView: GoalView = {
      goalId: "goal_123",
      title: "Test goal",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.INREVIEW,
      version: 3,
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
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    const mockContext = {
      goal: mockView,
      context: {
        components: [],
        dependencies: [],
        decisions: [],
        invariants: [],
        guidelines: [],
      },
    };
    (goalContextQueryHandler.execute as jest.Mock).mockResolvedValue(mockContext);

    const result = await handler.execute(command);

    expect(result.goal.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.REJECTED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(4);
    expect(appendedEvent.payload.status).toBe(GoalStatus.REJECTED);
    expect(appendedEvent.payload.reviewIssues).toBe("Missing error handling in API endpoint");
    expect(appendedEvent.payload.rejectedAt).toBeDefined();

    // Verify claim was released
    expect(claimStore.releaseClaim).toHaveBeenCalledWith("goal_123");

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.REJECTED);
  });

  it("should throw error if goal not found", async () => {
    const command: RejectGoalCommand = {
      goalId: "nonexistent",
      reviewIssues: "Some findings",
    };

    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error when rejecting from to-do status", async () => {
    const command: RejectGoalCommand = {
      goalId: "goal_789",
      reviewIssues: "Some findings",
    };

    const mockView: GoalView = {
      goalId: "goal_789",
      title: "Test goal",
      objective: "Not started goal",
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
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test goal",
          objective: "Not started goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot reject goal in defined status. Goal must be in in-review status."
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    const command: RejectGoalCommand = {
      goalId: "goal_123",
      reviewIssues: "Some findings",
    };

    const mockView: GoalView = {
      goalId: "goal_123",
      title: "Test goal",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.INREVIEW,
      version: 3,
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

  it("should propagate errors if event store fails", async () => {
    const command: RejectGoalCommand = {
      goalId: "goal_123",
      reviewIssues: "Some findings",
    };

    const mockView: GoalView = {
      goalId: "goal_123",
      title: "Test goal",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.INREVIEW,
      version: 3,
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
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });
});
