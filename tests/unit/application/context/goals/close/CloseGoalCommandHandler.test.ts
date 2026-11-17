/**
 * Tests for CloseGoalCommandHandler (command handler)
 */

import { CloseGoalCommandHandler } from "../../../../../../src/application/context/goals/close/CloseGoalCommandHandler";
import { CloseGoalCommand } from "../../../../../../src/application/context/goals/close/CloseGoalCommand";
import { IGoalClosedEventWriter } from "../../../../../../src/application/context/goals/close/IGoalClosedEventWriter";
import { IGoalClosedEventReader } from "../../../../../../src/application/context/goals/close/IGoalClosedEventReader";
import { IGoalCloseReader } from "../../../../../../src/application/context/goals/close/IGoalCloseReader";
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

describe("CloseGoalCommandHandler", () => {
  let eventWriter: IGoalClosedEventWriter;
  let eventReader: IGoalClosedEventReader;
  let goalReader: IGoalCloseReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: CloseGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 9 }),
    };

    // Mock event reader
    eventReader = {
      readStream: jest.fn(),
    };

    // Mock goal reader
    goalReader = {
      findById: jest.fn(),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    // Mock claim store
    claimStore = {
      getClaim: jest.fn().mockReturnValue(null),
      setClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    // Mock clock
    clock = {
      nowIso: jest.fn().mockReturnValue("2025-01-15T10:00:00.000Z"),
    };

    // Create claim policy with mocked dependencies
    claimPolicy = new GoalClaimPolicy(claimStore, clock);

    // Mock worker identity reader
    workerIdentityReader = {
      workerId: testWorkerId,
    };

    // Mock goal context query handler
    goalContextQueryHandler = {
      execute: jest.fn().mockResolvedValue({
        goal: {
          goalId: "goal_123",
          objective: "Mock objective",
          successCriteria: [],
          scopeIn: [],
          scopeOut: [],
          status: "codifying",
          version: 8,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          progress: [],
        },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
        },
      }),
    } as unknown as GoalContextQueryHandler;

    handler = new CloseGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
  });

  it("should close goal from codifying status, persist GoalClosedEvent with done status, release claim, and publish event", async () => {
    // Arrange
    const command: CloseGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.CODIFYING,
      version: 8,
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

    // Mock event history to CODIFYING state
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
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
        payload: {
          status: GoalStatus.IN_REFINEMENT,
        },
      },
      {
        type: GoalEventType.COMMITTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.REFINED,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T04:00:00Z",
        },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 6,
        timestamp: "2025-01-01T05:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T05:00:00Z",
        },
      },
      {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_123",
        version: 7,
        timestamp: "2025-01-01T06:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T06:00:00Z",
        },
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

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.CLOSED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(9);
    expect(appendedEvent.payload.status).toBe(GoalStatus.DONE);

    // Verify claim was released
    expect(claimStore.releaseClaim).toHaveBeenCalledWith("goal_123");

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.CLOSED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: CloseGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    // Arrange
    const command: CloseGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.CODIFYING,
      version: 8,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock another worker's active claim
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z", // Expires after current time (10:00)
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    // Verify domain logic was never called
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw error when closing from non-codifying status", async () => {
    // Arrange
    const command: CloseGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (to-do status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Not codifying goal",
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

    // Mock event history (only GoalAddedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Not codifying goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot close goal in defined status. Goal must be in codifying status."
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: CloseGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (codifying status)
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

    // Mock event history to CODIFYING state
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
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
        payload: {
          status: GoalStatus.IN_REFINEMENT,
        },
      },
      {
        type: GoalEventType.COMMITTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.REFINED,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T04:00:00Z",
        },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 6,
        timestamp: "2025-01-01T05:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T05:00:00Z",
        },
      },
      {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_123",
        version: 7,
        timestamp: "2025-01-01T06:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T06:00:00Z",
        },
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

    // Mock event store failure
    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });
});
