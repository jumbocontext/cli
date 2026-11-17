/**
 * Tests for SubmitGoalForReviewCommandHandler (command handler)
 */

import { SubmitGoalForReviewCommandHandler } from "../../../../../../src/application/context/goals/review/SubmitGoalForReviewCommandHandler";
import { SubmitGoalForReviewCommand } from "../../../../../../src/application/context/goals/review/SubmitGoalForReviewCommand";
import { IGoalSubmittedForReviewEventWriter } from "../../../../../../src/application/context/goals/review/IGoalSubmittedForReviewEventWriter";
import { IGoalSubmittedForReviewEventReader } from "../../../../../../src/application/context/goals/review/IGoalSubmittedForReviewEventReader";
import { IGoalSubmitForReviewReader } from "../../../../../../src/application/context/goals/review/IGoalSubmitForReviewReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { jest } from "@jest/globals";

describe("SubmitGoalForReviewCommandHandler", () => {
  let eventWriter: IGoalSubmittedForReviewEventWriter;
  let eventReader: IGoalSubmittedForReviewEventReader;
  let goalReader: IGoalSubmitForReviewReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let settingsReader: ISettingsReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: SubmitGoalForReviewCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 3 }),
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

    // Mock settings reader
    settingsReader = {
      read: jest.fn().mockResolvedValue({
        qa: { defaultTurnLimit: 3 },
        claims: { claimDurationMinutes: 120 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: false },
      }),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    };

    // Mock goal context query handler - returns context with the goalId from the request
    goalContextQueryHandler = {
      execute: jest.fn().mockImplementation(async (goalId: string) => ({
        goal: { goalId },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
        },
      })),
    } as unknown as GoalContextQueryHandler;

    handler = new SubmitGoalForReviewCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler
    );
  });

  it("should submit goal for review from submitted status, acquire reviewer claim, and publish GoalSubmittedForReviewEvent", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (submitted status - after goal submit)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.SUBMITTED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalRefinedEvent, GoalStartedEvent, GoalSubmittedEvent)
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
        type: GoalEventType.REFINED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T03:00:00Z",
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
    expect(appendedEvent.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(5);
    expect(appendedEvent.payload.status).toBe(GoalStatus.INREVIEW);
    expect(appendedEvent.payload.submittedAt).toBeDefined();
    // Verify reviewer claim is embedded in event
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);
    expect(appendedEvent.payload.claimedAt).toBeDefined();
    expect(appendedEvent.payload.claimExpiresAt).toBeDefined();

    // Verify reviewer claim was stored
    expect(claimStore.setClaim).toHaveBeenCalledTimes(1);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error if goal is in to-do status", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
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
      "Cannot submit goal for review in defined status. Goal must be in submitted status."
    );
  });

  it("should allow idempotent re-entry when goal is already in-review with no active claim", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_999",
    };

    // Mock projection exists (in-review status)
    const mockView: GoalView = {
      goalId: "goal_999",
      objective: "Already in review",
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

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalSubmittedEvent, GoalSubmittedForReviewEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_999",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already in review",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],

          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINED,
        aggregateId: "goal_999",
        version: 2,
        timestamp: "2025-01-01T00:30:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_999",
        version: 4,
        timestamp: "2025-01-01T01:30:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T01:30:00Z",
        },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_999",
        version: 5,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T02:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act - should succeed (idempotent re-entry, no active claim)
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_999");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
    expect(appendedEvent.payload.status).toBe(GoalStatus.INREVIEW);
  });

  it("should throw error if goal is already completed", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_completed",
    };

    // Mock projection exists (completed status)
    const mockView: GoalView = {
      goalId: "goal_completed",
      objective: "Already completed",
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
          objective: "Already completed",
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
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
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
      "Cannot submit goal for review in done status. Goal must be in submitted status."
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.SUBMITTED,
      version: 4,
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

    // Verify application logic was never called
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should allow review if claim has expired", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (submitted status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.SUBMITTED,
      version: 4,
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
        type: GoalEventType.REFINED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T03:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
  });

  it("should reject re-entry when goal is IN_REVIEW with active claim from another worker", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
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
      version: 5,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock active claim from another worker
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T09:30:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z", // Active
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );
    expect(eventWriter.append).not.toHaveBeenCalled();
  });

  it("should allow re-entry when goal is IN_REVIEW with expired claim (crash recovery)", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
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
      version: 5,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock expired claim (crash recovery)
    const otherWorkerId = createWorkerId("crashed-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T07:00:00.000Z",
      claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired
    });

    // Mock event history to IN_REVIEW state
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
        type: GoalEventType.REFINED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T03:00:00Z",
        },
      },
      {
        type: GoalEventType.SUBMITTED_FOR_REVIEW,
        aggregateId: "goal_123",
        version: 5,
        timestamp: "2025-01-01T04:00:00Z",
        payload: {
          status: GoalStatus.INREVIEW,
          submittedAt: "2025-01-01T04:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert - re-entry succeeds
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
    expect(appendedEvent.payload.status).toBe(GoalStatus.INREVIEW);
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: SubmitGoalForReviewCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (submitted status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.SUBMITTED,
      version: 4,
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
        type: GoalEventType.REFINED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
      {
        type: GoalEventType.SUBMITTED,
        aggregateId: "goal_123",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.SUBMITTED,
          submittedAt: "2025-01-01T03:00:00Z",
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
