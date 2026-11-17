/**
 * Tests for RefineGoalCommandHandler (command handler)
 */

import { RefineGoalCommandHandler } from "../../../../../../src/application/context/goals/refine/RefineGoalCommandHandler";
import { RefineGoalCommand } from "../../../../../../src/application/context/goals/refine/RefineGoalCommand";
import { IGoalRefineEventWriter } from "../../../../../../src/application/context/goals/refine/IGoalRefineEventWriter";
import { IGoalRefineEventReader } from "../../../../../../src/application/context/goals/refine/IGoalRefineEventReader";
import { IGoalRefineReader } from "../../../../../../src/application/context/goals/refine/IGoalRefineReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader";
import { jest } from "@jest/globals";

describe("RefineGoalCommandHandler", () => {
  let eventWriter: IGoalRefineEventWriter;
  let eventReader: IGoalRefineEventReader;
  let goalReader: IGoalRefineReader;
  let eventBus: IEventBus;
  let claimPolicy: {
    canClaim: jest.Mock;
    prepareClaim: jest.Mock;
    prepareEntryClaim: jest.Mock;
    storeClaim: jest.Mock;
    releaseClaim: jest.Mock;
  };
  let workerIdentityReader: { workerId: string };
  let settingsReader: {
    read: jest.Mock;
    write: jest.Mock;
    hasTelemetryConfiguration: jest.Mock;
  };
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: RefineGoalCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 2 }),
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

    // Mock claim policy
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
      prepareClaim: jest.fn().mockReturnValue({
        goalId: "goal_123",
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      }),
      prepareEntryClaim: jest.fn().mockReturnValue({
        allowed: true,
        claim: {
          goalId: "goal_123",
          claimedBy: "worker_test",
          claimedAt: "2025-01-01T00:00:00Z",
          claimExpiresAt: "2025-01-01T01:00:00Z",
        },
      }),
      storeClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    // Mock worker identity reader
    workerIdentityReader = { workerId: "worker_test" };

    // Mock settings reader
    settingsReader = {
      read: jest.fn().mockResolvedValue({
        qa: { defaultTurnLimit: 3 },
        claims: { claimDurationMinutes: 60 },
        telemetry: { enabled: false, anonymousId: null, consentGiven: false },
      }),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    };

    // Mock goal context query handler
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

    handler = new RefineGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy as unknown as GoalClaimPolicy,
      workerIdentityReader as unknown as IWorkerIdentityReader,
      settingsReader as unknown as ISettingsReader,
      goalContextQueryHandler
    );
  });

  it("should refine goal and publish GoalRefinementStartedEvent", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (to-do status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent only)
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
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goal.goalId).toBe("goal_123");
    expect(goalContextQueryHandler.execute).toHaveBeenCalledWith("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.REFINEMENT_STARTED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(2);
    expect(appendedEvent.payload.status).toBe(GoalStatus.IN_REFINEMENT);
    expect(appendedEvent.payload.claimedBy).toBeDefined();
    expect(appendedEvent.payload.refinementStartedAt).toBeDefined();

    // Verify claim was stored
    expect(claimPolicy.storeClaim).toHaveBeenCalled();

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.REFINEMENT_STARTED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error if goal already refined", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_456",
    };

    // Mock projection exists (refined status)
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Already refined goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.REFINED,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalRefinedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already refined goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINED,
        aggregateId: "goal_456",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.REFINED,
          refinedAt: "2025-01-01T01:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is already refined."
    );
  });

  it("should throw error if goal is in doing status", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (doing status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Goal in progress",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalRefinedEvent, GoalStartedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Goal in progress",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINED,
        aggregateId: "goal_789",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.REFINED,
          refinedAt: "2025-01-01T01:00:00Z",
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_789",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot refine goal in doing status"
    );
  });

  it("should throw error if goal is completed", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_999",
    };

    // Mock projection exists (completed status)
    const mockView: GoalView = {
      goalId: "goal_999",
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
        aggregateId: "goal_999",
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
        type: GoalEventType.REFINED,
        aggregateId: "goal_999",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.REFINED,
          refinedAt: "2025-01-01T01:00:00Z",
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.QUALIFIED,
        aggregateId: "goal_999",
        version: 4,
        timestamp: "2025-01-01T03:00:00Z",
        payload: {
          status: GoalStatus.QUALIFIED,
        },
      },
      {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_999",
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
      "Cannot refine goal in done status"
    );
  });

  it("should allow idempotent re-entry when goal is IN_REFINEMENT with expired claim", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (in-refinement status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.IN_REFINEMENT,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock prepareEntryClaim returns allowed (expired claim re-entry)
    claimPolicy.prepareEntryClaim.mockReturnValue({
      allowed: true,
      claim: {
        goalId: "goal_123",
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T02:00:00Z",
        claimExpiresAt: "2025-01-01T03:00:00Z",
      },
    });

    // Mock event history (GoalAddedEvent, GoalRefinementStartedEvent)
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
          refinementStartedAt: "2025-01-01T01:00:00Z",
          claimedBy: "other_worker",
          claimedAt: "2025-01-01T01:00:00Z",
          claimExpiresAt: "2025-01-01T02:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert - re-entry succeeds, new event persisted
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.REFINEMENT_STARTED);
    expect(appendedEvent.payload.status).toBe(GoalStatus.IN_REFINEMENT);
    expect(claimPolicy.storeClaim).toHaveBeenCalled();
  });

  it("should reject re-entry when another worker holds an active claim", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.IN_REFINEMENT,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock prepareEntryClaim returns rejected (active claim from another worker)
    claimPolicy.prepareEntryClaim.mockReturnValue({
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim: {
        goalId: "goal_123",
        claimedBy: "other_worker",
        claimedAt: "2025-01-01T01:00:00Z",
        claimExpiresAt: "2025-01-01T03:00:00Z",
      },
    });

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-01T03:00:00Z."
    );
    expect(eventWriter.append).not.toHaveBeenCalled();
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: RefineGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
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
