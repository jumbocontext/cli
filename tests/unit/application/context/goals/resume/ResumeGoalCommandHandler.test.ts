/**
 * Tests for ResumeGoalCommandHandler (command handler)
 */

import { ResumeGoalCommandHandler } from "../../../../../../src/application/context/goals/resume/ResumeGoalCommandHandler";
import { ResumeGoalCommand } from "../../../../../../src/application/context/goals/resume/ResumeGoalCommand";
import { IGoalResumedEventWriter } from "../../../../../../src/application/context/goals/resume/IGoalResumedEventWriter";
import { IGoalResumedEventReader } from "../../../../../../src/application/context/goals/resume/IGoalResumedEventReader";
import { IGoalReader } from "../../../../../../src/application/context/goals/resume/IGoalReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { jest } from "@jest/globals";

describe("ResumeGoalCommandHandler", () => {
  let eventWriter: IGoalResumedEventWriter;
  let eventReader: IGoalResumedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let settingsReader: ISettingsReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: ResumeGoalCommandHandler;

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

    // Mock settings reader
    settingsReader = {
      read: jest.fn().mockResolvedValue({
        qa: { defaultTurnLimit: 3 },
        claims: { claimDurationMinutes: 30 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: false },
      }),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    };

    // Mock goal context query handler - will be customized per test
    goalContextQueryHandler = {
      execute: jest.fn().mockImplementation(async (goalId: string) => ({
        goal: await goalReader.findById(goalId),
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
        },
      })),
    } as unknown as GoalContextQueryHandler;

    handler = new ResumeGoalCommandHandler(
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

  it("should resume goal and publish GoalResumedEvent", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalPausedEvent)
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
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "ContextCompressed",
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
    expect(appendedEvent.type).toBe(GoalEventType.RESUMED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(4);
    expect(appendedEvent.payload.status).toBe(GoalStatus.DOING);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.RESUMED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should resume goal with optional note", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_456",
      note: "Ready to continue",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Fix bug",
      successCriteria: ["Bug resolved"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
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
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Fix bug",
          successCriteria: ["Bug resolved"],
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
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_456",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "Other",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_456");
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.note).toBe("Ready to continue");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should propagate validation error if goal not paused", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (doing status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Already active goal",
      successCriteria: ["Criterion"],
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
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already active goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_789",
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
      "Cannot resume goal in doing status"
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
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
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "ContextCompressed",
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

  it("should include claim data in GoalResumedEvent payload", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_claim_test",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_claim_test",
      objective: "Test claim data",
      successCriteria: ["Claim verified"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.PAUSED,
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
        aggregateId: "goal_claim_test",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Test claim data",
          successCriteria: ["Claim verified"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_claim_test",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_claim_test",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "ContextCompressed",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_claim_test");

    // Verify claim data is included in the event payload
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);
    expect(appendedEvent.payload.claimedAt).toBe("2025-01-15T10:00:00.000Z");
    // Claim duration is 30 minutes = 30 * 60 * 1000 ms
    expect(appendedEvent.payload.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");

    // Verify claim was stored after event persistence
    expect(claimStore.setClaim).toHaveBeenCalledWith({
      goalId: "goal_claim_test",
      claimedBy: testWorkerId,
      claimedAt: "2025-01-15T10:00:00.000Z",
      claimExpiresAt: "2025-01-15T10:30:00.000Z",
    });
  });
});
