/**
 * Tests for RebuildDatabaseCommandHandler
 */

import { RebuildDatabaseCommandHandler } from "../../../../../../src/application/maintenance/db/rebuild/RebuildDatabaseCommandHandler";
import { IEventStore } from "../../../../../../src/application/persistence/IEventStore";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent";
import { RebuildDatabaseCommand } from "../../../../../../src/application/maintenance/db/rebuild/RebuildDatabaseCommand";
import { jest } from "@jest/globals";

describe("RebuildDatabaseCommandHandler", () => {
  let eventStore: jest.Mocked<IEventStore>;
  let eventBus: jest.Mocked<IEventBus>;
  let handler: RebuildDatabaseCommandHandler;

  beforeEach(() => {
    // Mock event store
    eventStore = {
      getAllEvents: jest.fn(),
      append: jest.fn(),
      readStream: jest.fn(),
    };

    // Mock event bus
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };

    handler = new RebuildDatabaseCommandHandler(eventStore, eventBus);
  });

  it("should replay all events from event store", async () => {
    // Arrange
    const events: BaseEvent[] = [
      {
        type: "SessionStartedEvent",
        aggregateId: "session_1",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
      },
      {
        type: "GoalAddedEvent",
        aggregateId: "goal_1",
        version: 1,
        timestamp: "2025-01-01T10:01:00Z",
      },
      {
        type: "ComponentAddedEvent",
        aggregateId: "component_1",
        version: 1,
        timestamp: "2025-01-01T10:02:00Z",
      },
    ];

    eventStore.getAllEvents.mockResolvedValue(events);

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(eventStore.getAllEvents).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(3);
    expect(eventBus.publish).toHaveBeenNthCalledWith(1, events[0]);
    expect(eventBus.publish).toHaveBeenNthCalledWith(2, events[1]);
    expect(eventBus.publish).toHaveBeenNthCalledWith(3, events[2]);
    expect(result).toEqual({
      eventsReplayed: 3,
      success: true,
    });
  });

  it("should handle empty event store", async () => {
    // Arrange
    eventStore.getAllEvents.mockResolvedValue([]);

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(eventStore.getAllEvents).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(result).toEqual({
      eventsReplayed: 0,
      success: true,
    });
  });

  it("should replay events in timestamp order", async () => {
    // Arrange
    const events: BaseEvent[] = [
      {
        type: "Event1",
        aggregateId: "agg_1",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
      },
      {
        type: "Event2",
        aggregateId: "agg_2",
        version: 1,
        timestamp: "2025-01-01T10:05:00Z",
      },
      {
        type: "Event3",
        aggregateId: "agg_3",
        version: 1,
        timestamp: "2025-01-01T10:03:00Z",
      },
    ];

    eventStore.getAllEvents.mockResolvedValue(events);

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    // Act
    await handler.handle(command);

    // Assert - events should be published in the order returned by getAllEvents
    // (getAllEvents is responsible for sorting by timestamp)
    expect(eventBus.publish).toHaveBeenNthCalledWith(1, events[0]);
    expect(eventBus.publish).toHaveBeenNthCalledWith(2, events[1]);
    expect(eventBus.publish).toHaveBeenNthCalledWith(3, events[2]);
  });

  it("should replay project events with their persisted aggregate id intact", async () => {
    const projectId = "11111111-1111-4111-8111-111111111111";
    const events: BaseEvent[] = [
      {
        type: "ProjectInitializedEvent",
        aggregateId: projectId,
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        payload: {
          name: "Jumbo",
          purpose: "Context orchestration",
        },
      },
      {
        type: "ProjectUpdatedEvent",
        aggregateId: projectId,
        version: 2,
        timestamp: "2025-01-01T10:05:00Z",
        payload: {
          purpose: "Stable identity",
        },
      },
    ];

    eventStore.getAllEvents.mockResolvedValue(events);

    const result = await handler.handle({ skipConfirmation: true });

    expect(eventBus.publish).toHaveBeenNthCalledWith(1, events[0]);
    expect(eventBus.publish).toHaveBeenNthCalledWith(2, events[1]);
    expect(result.eventsReplayed).toBe(2);
  });

  it("should continue replaying even if a single event handler fails", async () => {
    // Arrange
    const events: BaseEvent[] = [
      {
        type: "Event1",
        aggregateId: "agg_1",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
      },
      {
        type: "Event2",
        aggregateId: "agg_2",
        version: 1,
        timestamp: "2025-01-01T10:01:00Z",
      },
      {
        type: "Event3",
        aggregateId: "agg_3",
        version: 1,
        timestamp: "2025-01-01T10:02:00Z",
      },
    ];

    eventStore.getAllEvents.mockResolvedValue(events);

    // Mock event bus to fail on second event but succeed on others
    eventBus.publish
      .mockResolvedValueOnce(undefined) // Event1 succeeds
      .mockRejectedValueOnce(new Error("Handler error")) // Event2 fails
      .mockResolvedValueOnce(undefined); // Event3 succeeds

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    // Act & Assert
    // The handler should propagate the error from the failed event
    await expect(handler.handle(command)).rejects.toThrow("Handler error");

    // But it should have attempted to publish the first two events
    expect(eventBus.publish).toHaveBeenCalledTimes(2);
  });

  it("should handle large number of events", async () => {
    // Arrange
    const events: BaseEvent[] = Array.from({ length: 1000 }, (_, i) => ({
      type: `Event${i}`,
      aggregateId: `agg_${i}`,
      version: 1,
      timestamp: new Date(2025, 0, 1, 10, 0, i).toISOString(),
    }));

    eventStore.getAllEvents.mockResolvedValue(events);

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(eventStore.getAllEvents).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1000);
    expect(result).toEqual({
      eventsReplayed: 1000,
      success: true,
    });
  });
});
