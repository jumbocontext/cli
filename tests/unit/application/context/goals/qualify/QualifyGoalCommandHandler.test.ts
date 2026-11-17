/**
 * Tests for QualifyGoalCommandHandler (command handler)
 */

import { QualifyGoalCommandHandler } from "../../../../../../src/application/context/goals/qualify/QualifyGoalCommandHandler";
import { QualifyGoalCommand } from "../../../../../../src/application/context/goals/qualify/QualifyGoalCommand";
import { IGoalQualifiedEventWriter } from "../../../../../../src/application/context/goals/qualify/IGoalQualifiedEventWriter";
import { IGoalQualifiedEventReader } from "../../../../../../src/application/context/goals/qualify/IGoalQualifiedEventReader";
import { IGoalQualifyReader } from "../../../../../../src/application/context/goals/qualify/IGoalQualifyReader";
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

describe("QualifyGoalCommandHandler", () => {
  let eventWriter: IGoalQualifiedEventWriter;
  let eventReader: IGoalQualifiedEventReader;
  let goalReader: IGoalQualifyReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: QualifyGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
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
      execute: jest.fn(),
    } as unknown as GoalContextQueryHandler;

    handler = new QualifyGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
  });

  it("should qualify goal from in-review status and publish GoalQualifiedEvent event", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
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

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalSubmittedForReviewEvent)
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
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
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

    // Mock goal context query result
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

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.APPROVED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(4);
    expect(appendedEvent.payload.status).toBe(GoalStatus.QUALIFIED);
    expect(appendedEvent.payload.approvedAt).toBeDefined();

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.APPROVED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should throw error when qualifying from doing status", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_456",
    };

    // Mock projection exists (doing status)
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement feature",
          successCriteria: ["Feature works"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_456",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot approve goal in doing status. Goal must be in-review."
    );
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error when qualifying from to-do status", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (to-do status)
    const mockView: GoalView = {
      goalId: "goal_789",
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

    // Mock event history (only GoalAddedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Not started goal",
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
      "Cannot approve goal in defined status. Goal must be in-review."
    );
  });

  it("should throw error when qualifying from qualified status", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_999",
    };

    // Mock projection exists (qualified status)
    const mockView: GoalView = {
      goalId: "goal_999",
      objective: "Already qualified",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.QUALIFIED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_999",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already qualified",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_999",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_999",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot approve goal in approved status. Goal must be in-review."
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
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

  it("should allow qualification if claim has expired", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (in-review status)
    const mockView: GoalView = {
      goalId: "goal_123",
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

    // Mock expired claim from another worker
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T08:00:00.000Z",
      claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired before current time (10:00)
    });

    // Mock event history
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
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
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

    // Mock goal context query result
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

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
  });

  it("should allow qualification if current worker owns the claim", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (in-review status)
    const mockView: GoalView = {
      goalId: "goal_123",
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

    // Mock claim owned by current worker
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: testWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z",
    });

    // Mock event history
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
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
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

    // Mock goal context query result
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

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (in-review status)
    const mockView: GoalView = {
      goalId: "goal_123",
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

    // Mock event history
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
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
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

    // Mock event store failure
    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });

  it("should throw error when qualifying from blocked status", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_blocked",
    };

    // Mock projection exists (blocked status)
    const mockView: GoalView = {
      goalId: "goal_blocked",
      objective: "Blocked goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.BLOCKED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      note: "Blocked by external dependency",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_blocked",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Blocked goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_blocked",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.BLOCKED,
        aggregateId: "goal_blocked",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.BLOCKED,
          note: "Blocked by external dependency",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot approve goal in blocked status. Goal must be in-review."
    );
  });

  it("should throw error when qualifying from completed status", async () => {
    // Arrange
    const command: QualifyGoalCommand = {
      goalId: "goal_completed",
    };

    // Mock projection exists (completed status)
    const mockView: GoalView = {
      goalId: "goal_completed",
      objective: "Completed goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.COMPLETED,
      version: 5,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_completed",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Completed goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_completed",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: "GoalSubmittedForReviewEvent",
        aggregateId: "goal_completed",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
      {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_completed",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
          qualifiedAt: "2025-01-01T03:00:00Z",
        },
      },
      {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_completed",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: {
          status: GoalStatus.COMPLETED,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot approve goal in done status. Goal must be in-review."
    );
  });
});
