/**
 * Tests for RemoveValuePropositionHandler
 */

import { RemoveValuePropositionCommandHandler } from "../../../../../../src/application/context/value-propositions/remove/RemoveValuePropositionCommandHandler.js";
import { RemoveValuePropositionCommand } from "../../../../../../src/application/context/value-propositions/remove/RemoveValuePropositionCommand.js";
import { IValuePropositionRemovedEventWriter } from "../../../../../../src/application/context/value-propositions/remove/IValuePropositionRemovedEventWriter.js";
import { IValuePropositionRemoveReader } from "../../../../../../src/application/context/value-propositions/remove/IValuePropositionRemoveReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ValuePropositionAddedEvent } from "../../../../../../src/domain/value-propositions/add/ValuePropositionAddedEvent.js";
import { ValuePropositionRemovedEvent } from "../../../../../../src/domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { ValuePropositionEventType } from "../../../../../../src/domain/value-propositions/Constants.js";
import { ValuePropositionView } from "../../../../../../src/application/context/value-propositions/ValuePropositionView.js";
import { jest } from "@jest/globals";

describe("RemoveValuePropositionCommandHandler", () => {
  let handler: RemoveValuePropositionCommandHandler;
  let eventWriter: IValuePropositionRemovedEventWriter;
  let reader: IValuePropositionRemoveReader;
  let eventBus: IEventBus;

  // Test data
  const valueId = "value_test123";
  const addedEvent: ValuePropositionAddedEvent = {
    type: ValuePropositionEventType.ADDED,
    aggregateId: valueId,
    version: 1,
    timestamp: "2025-11-09T10:00:00Z",
    payload: {
      title: "Persistent context",
      description: "Maintain context across sessions",
      benefit: "Developers don't lose work",
      measurableOutcome: null,
    },
  };

  const existingView: ValuePropositionView = {
    valuePropositionId: valueId,
    title: "Persistent context",
    description: "Maintain context across sessions",
    benefit: "Developers don't lose work",
    measurableOutcome: null,
    version: 1,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T10:00:00Z",
  };

  beforeEach(() => {
    // Create mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn().mockResolvedValue([addedEvent]),
    };

    // Create mock reader
    reader = {
      findById: jest.fn().mockResolvedValue(existingView),
    };

    // Create mock event bus
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };

    // Create handler
    handler = new RemoveValuePropositionCommandHandler(
      eventWriter,
      eventBus,
      reader
    );
  });

  describe("Successful removal", () => {
    it("should remove value proposition and return result", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.valuePropositionId).toBe(valueId);
      expect(result.title).toBe("Persistent context");
      expect(reader.findById).toHaveBeenCalledWith(valueId);
      expect(eventWriter.readStream).toHaveBeenCalledWith(valueId);
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it("should create ValuePropositionRemoved event", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionRemovedEvent;
      expect(appendCall.type).toBe(ValuePropositionEventType.REMOVED);
      expect(appendCall.aggregateId).toBe(valueId);
      expect(appendCall.version).toBe(2);
      expect(appendCall.payload).toEqual({});
      expect(appendCall.timestamp).toBeDefined();
    });

    it("should rehydrate aggregate from event history", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert - verify readStream was called to get history
      expect(eventWriter.readStream).toHaveBeenCalledWith(valueId);
    });

    it("should publish event to event bus", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(publishedEvent.type).toBe(ValuePropositionEventType.REMOVED);
      expect(publishedEvent.aggregateId).toBe(valueId);
    });

    it("should persist event to event store", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
      expect(appendedEvent.type).toBe(ValuePropositionEventType.REMOVED);
    });
  });

  describe("Error handling", () => {
    it("should throw error when value proposition not found", async () => {
      // Arrange
      (reader.findById as jest.Mock).mockResolvedValue(null);
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: "nonexistent-value",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Value proposition with ID nonexistent-value not found"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe("Event versioning", () => {
    it("should increment version correctly", async () => {
      // Arrange
      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionRemovedEvent;
      expect(appendCall.version).toBe(2); // First version is 1, remove is 2
    });

    it("should handle multiple events with correct versioning", async () => {
      // Arrange - simulate update event
      const updateEvent = {
        type: ValuePropositionEventType.UPDATED,
        aggregateId: valueId,
        version: 2,
        timestamp: "2025-11-09T11:00:00Z",
        payload: {
          title: "Updated title",
        },
      };
      (eventWriter.readStream as jest.Mock).mockResolvedValue([
        addedEvent,
        updateEvent,
      ]);

      const command: RemoveValuePropositionCommand = {
        valuePropositionId: valueId,
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionRemovedEvent;
      expect(appendCall.version).toBe(3);
    });
  });
});
