/**
 * Tests for CodifyGoalCommandHandler (command handler)
 */

import { CodifyGoalCommandHandler } from "../../../../../../src/application/context/goals/codify/CodifyGoalCommandHandler";
import { CodifyGoalCommand } from "../../../../../../src/application/context/goals/codify/CodifyGoalCommand";
import { IGoalCodifyingStartedEventWriter } from "../../../../../../src/application/context/goals/codify/IGoalCodifyingStartedEventWriter";
import { IGoalCodifyingStartedEventReader } from "../../../../../../src/application/context/goals/codify/IGoalCodifyingStartedEventReader";
import { IGoalCodifyReader } from "../../../../../../src/application/context/goals/codify/IGoalCodifyReader";
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

describe("CodifyGoalCommandHandler", () => {
  let eventWriter: IGoalCodifyingStartedEventWriter;
  let eventReader: IGoalCodifyingStartedEventReader;
  let goalReader: IGoalCodifyReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let settingsReader: ISettingsReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: CodifyGoalCommandHandler;

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

    // Mock goal context query handler
    goalContextQueryHandler = {
      execute: jest.fn(),
    } as unknown as GoalContextQueryHandler;

    handler = new CodifyGoalCommandHandler(
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

  const buildQualifiedHistory = (goalId: string) => [
    {
      type: GoalEventType.ADDED,
      aggregateId: goalId,
      version: 1,
      timestamp: "2025-01-01T00:00:00Z",
      payload: {
        title: "Test Goal",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
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

  it("should codify goal from QUALIFIED status, persist event, store claim, publish event, and return context", async () => {
    // Arrange
    const command: CodifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (qualified status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.QUALIFIED,
      version: 7,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T06:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history to QUALIFIED state
    (eventReader.readStream as jest.Mock).mockResolvedValue(buildQualifiedHistory("goal_123"));

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
    expect(appendedEvent.type).toBe(GoalEventType.CODIFYING_STARTED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(8);
    expect(appendedEvent.payload.status).toBe(GoalStatus.CODIFYING);
    expect(appendedEvent.payload.codifyStartedAt).toBeDefined();
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);
    expect(appendedEvent.payload.claimedAt).toBeDefined();
    expect(appendedEvent.payload.claimExpiresAt).toBeDefined();

    // Verify claim was stored
    expect(claimStore.setClaim).toHaveBeenCalledTimes(1);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.CODIFYING_STARTED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should allow idempotent re-entry when goal is already CODIFYING with expired claim", async () => {
    // Arrange
    const command: CodifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (codifying status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.CODIFYING,
      version: 8,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T07:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock expired claim from another worker (crash recovery)
    const otherWorkerId = createWorkerId("crashed-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T07:00:00.000Z",
      claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired before current time (10:00)
    });

    // Mock event history to CODIFYING state
    const codifyingHistory = [
      ...buildQualifiedHistory("goal_123"),
      {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_123",
        version: 8,
        timestamp: "2025-01-01T07:00:00Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2025-01-01T07:00:00Z",
          claimedBy: otherWorkerId,
          claimedAt: "2025-01-01T07:00:00Z",
          claimExpiresAt: "2025-01-01T09:00:00Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(codifyingHistory);

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

    // Assert - re-entry succeeds, new event persisted
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.CODIFYING_STARTED);
    expect(appendedEvent.payload.status).toBe(GoalStatus.CODIFYING);
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);

    // Verify claim was stored
    expect(claimStore.setClaim).toHaveBeenCalledTimes(1);
  });

  it("should reject re-entry when goal is CODIFYING with active claim from another worker", async () => {
    // Arrange
    const command: CodifyGoalCommand = {
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
      updatedAt: "2025-01-01T07:00:00Z",
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

  it("should allow same-worker re-entry with lease renewal", async () => {
    // Arrange
    const command: CodifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists (codifying status)
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.CODIFYING,
      version: 8,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T07:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock active claim from same worker (lease renewal scenario)
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: testWorkerId,
      claimedAt: "2025-01-15T08:00:00.000Z",
      claimExpiresAt: "2025-01-15T10:30:00.000Z", // Active, same worker
    });

    // Mock event history to CODIFYING state
    const codifyingHistory = [
      ...buildQualifiedHistory("goal_123"),
      {
        type: GoalEventType.CODIFYING_STARTED,
        aggregateId: "goal_123",
        version: 8,
        timestamp: "2025-01-01T07:00:00Z",
        payload: {
          status: GoalStatus.CODIFYING,
          codifyStartedAt: "2025-01-01T07:00:00Z",
          claimedBy: testWorkerId,
          claimedAt: "2025-01-15T08:00:00.000Z",
          claimExpiresAt: "2025-01-15T10:30:00.000Z",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(codifyingHistory);

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

    // Assert - re-entry succeeds with lease renewal
    expect(result.goal.goalId).toBe("goal_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.CODIFYING_STARTED);
    expect(appendedEvent.payload.claimedBy).toBe(testWorkerId);
    // Claim preserves original claimedAt (refreshed, not new)
    expect(appendedEvent.payload.claimedAt).toBe("2025-01-15T08:00:00.000Z");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: CodifyGoalCommand = {
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
    const command: CodifyGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.QUALIFIED,
      version: 7,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T06:00:00Z",
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
});
