/**
 * Tests for PauseGoalCommandHandler (command handler)
 */

import { PauseGoalCommandHandler } from "../../../../../../src/application/context/goals/pause/PauseGoalCommandHandler";
import { PauseGoalCommand } from "../../../../../../src/application/context/goals/pause/PauseGoalCommand";
import { IGoalPausedEventWriter } from "../../../../../../src/application/context/goals/pause/IGoalPausedEventWriter";
import { IGoalPausedEventReader } from "../../../../../../src/application/context/goals/pause/IGoalPausedEventReader";
import { IGoalReader } from "../../../../../../src/application/context/goals/pause/IGoalReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { jest } from "@jest/globals";

describe("PauseGoalCommandHandler", () => {
  let eventWriter: IGoalPausedEventWriter;
  let eventReader: IGoalPausedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let handler: PauseGoalCommandHandler;

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

    handler = new PauseGoalCommandHandler(eventWriter, eventReader, goalReader, eventBus);
  });

  it("should pause goal and publish GoalPausedEvent", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "goal_123",
      reason: "ContextCompressed",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
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
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.PAUSED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(3);
    expect(appendedEvent.payload.status).toBe(GoalStatus.PAUSED);
    expect(appendedEvent.payload.reason).toBe("ContextCompressed");

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.PAUSED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should pause goal with optional note", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "goal_456",
      reason: "Other",
      note: "Need to switch priorities",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Fix bug",
      successCriteria: ["Bug resolved"],
      scopeIn: [],
      scopeOut: [],
      
      status: GoalStatus.DOING,
      version: 2,
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
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_456");
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.note).toBe("Need to switch priorities");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "nonexistent",
      reason: "ContextCompressed",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should propagate validation error if goal not in doing status", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "goal_789",
      reason: "ContextCompressed",
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
      "Cannot pause goal in defined status"
    );
  });

  it("should propagate validation error if goal already paused", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "goal_999",
      reason: "Other",
    };

    // Mock projection exists (paused status)
    const mockView: GoalView = {
      goalId: "goal_999",
      objective: "Already paused",
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

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalPausedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_999",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already paused",
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
        type: GoalEventType.PAUSED,
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "ContextCompressed",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot pause goal in paused status"
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: PauseGoalCommand = {
      goalId: "goal_123",
      reason: "ContextCompressed",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
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
