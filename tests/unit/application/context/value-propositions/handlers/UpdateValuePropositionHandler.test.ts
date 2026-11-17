/**
 * Tests for UpdateValuePropositionHandler
 */

import { UpdateValuePropositionCommandHandler } from "../../../../../../src/application/context/value-propositions/update/UpdateValuePropositionCommandHandler.js";
import { UpdateValuePropositionCommand } from "../../../../../../src/application/context/value-propositions/update/UpdateValuePropositionCommand.js";
import { IValuePropositionUpdatedEventWriter } from "../../../../../../src/application/context/value-propositions/update/IValuePropositionUpdatedEventWriter.js";
import { IValuePropositionUpdateReader } from "../../../../../../src/application/context/value-propositions/update/IValuePropositionUpdateReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ValuePropositionAddedEvent } from "../../../../../../src/domain/value-propositions/add/ValuePropositionAddedEvent.js";
import { ValuePropositionUpdatedEvent } from "../../../../../../src/domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionEventType } from "../../../../../../src/domain/value-propositions/Constants.js";
import { ValuePropositionView } from "../../../../../../src/application/context/value-propositions/ValuePropositionView.js";
import { jest } from "@jest/globals";

describe("UpdateValuePropositionCommandHandler", () => {
  let handler: UpdateValuePropositionCommandHandler;
  let eventWriter: IValuePropositionUpdatedEventWriter;
  let reader: IValuePropositionUpdateReader;
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
    handler = new UpdateValuePropositionCommandHandler(
      eventWriter,
      eventBus,
      reader
    );
  });

  describe("Successful updates", () => {
    it("should update title only", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Updated title",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.valuePropositionId).toBe(valueId);
      expect(reader.findById).toHaveBeenCalledWith(valueId);
      expect(eventWriter.readStream).toHaveBeenCalledWith(valueId);
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);

      // Verify event structure
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.type).toBe(ValuePropositionEventType.UPDATED);
      expect(appendCall.aggregateId).toBe(valueId);
      expect(appendCall.version).toBe(2);
      expect(appendCall.payload.title).toBe("Updated title");
      expect(appendCall.payload.description).toBeUndefined();
      expect(appendCall.payload.benefit).toBeUndefined();
      expect(appendCall.payload.measurableOutcome).toBeUndefined();
    });

    it("should update description only", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        description: "Updated description",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.valuePropositionId).toBe(valueId);

      // Verify event structure
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.type).toBe(ValuePropositionEventType.UPDATED);
      expect(appendCall.payload.title).toBeUndefined();
      expect(appendCall.payload.description).toBe("Updated description");
      expect(appendCall.payload.benefit).toBeUndefined();
    });

    it("should update benefit only", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        benefit: "Updated benefit",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.payload.benefit).toBe("Updated benefit");
      expect(appendCall.payload.title).toBeUndefined();
      expect(appendCall.payload.description).toBeUndefined();
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "New title",
        description: "New description",
        benefit: "New benefit",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.valuePropositionId).toBe(valueId);

      // Verify event contains all fields
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.payload.title).toBe("New title");
      expect(appendCall.payload.description).toBe("New description");
      expect(appendCall.payload.benefit).toBe("New benefit");
    });

    it("should set measurable outcome", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        measurableOutcome: "Zero context loss",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.payload.measurableOutcome).toBe("Zero context loss");
    });

    it("should clear measurable outcome", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        measurableOutcome: null,
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.payload.measurableOutcome).toBe(null);
    });

    it("should rehydrate aggregate from event history", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Updated Title",
      };

      // Act
      await handler.execute(command);

      // Assert - verify readStream was called to get history
      expect(eventWriter.readStream).toHaveBeenCalledWith(valueId);
    });

    it("should publish event to event bus", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Updated Title",
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(publishedEvent.type).toBe(ValuePropositionEventType.UPDATED);
      expect(publishedEvent.aggregateId).toBe(valueId);
    });

    it("should persist event to event store", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Updated Title",
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
      expect(appendedEvent.type).toBe(ValuePropositionEventType.UPDATED);
    });
  });

  describe("Error handling", () => {
    it("should throw error when value proposition not found", async () => {
      // Arrange
      (reader.findById as jest.Mock).mockResolvedValue(null);
      const command: UpdateValuePropositionCommand = {
        id: "nonexistent-value",
        title: "Updated Title",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Value proposition with ID nonexistent-value not found"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when no changes provided", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "At least one field must be provided for update"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when title validation fails", async () => {
      // Arrange
      const longTitle = "a".repeat(101); // Max is 100
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: longTitle,
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Title must be less than 100 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when description validation fails", async () => {
      // Arrange
      const longDescription = "a".repeat(1001); // Max is 1000
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        description: longDescription,
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Description must be less than 1000 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when benefit validation fails", async () => {
      // Arrange
      const longBenefit = "a".repeat(501); // Max is 500
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        benefit: longBenefit,
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Benefit must be less than 500 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when measurable outcome validation fails", async () => {
      // Arrange
      const longOutcome = "a".repeat(501); // Max is 500
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        measurableOutcome: longOutcome,
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Measurable outcome must be less than 500 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when empty title provided", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Value proposition title must be provided"
      );
    });

    it("should throw error when empty description provided", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        description: "",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Description must be provided"
      );
    });

    it("should throw error when empty benefit provided", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        benefit: "",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Benefit must be provided"
      );
    });
  });

  describe("Event versioning", () => {
    it("should increment version correctly", async () => {
      // Arrange
      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Updated Title",
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.version).toBe(2); // First version is 1, update is 2
    });

    it("should handle multiple updates with correct versioning", async () => {
      // Arrange - simulate two previous events
      const secondEvent: ValuePropositionUpdatedEvent = {
        type: ValuePropositionEventType.UPDATED,
        aggregateId: valueId,
        version: 2,
        timestamp: "2025-11-09T11:00:00Z",
        payload: {
          title: "First update",
        },
      };
      (eventWriter.readStream as jest.Mock).mockResolvedValue([
        addedEvent,
        secondEvent,
      ]);

      const command: UpdateValuePropositionCommand = {
        id: valueId,
        title: "Third version",
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock
        .calls[0][0] as ValuePropositionUpdatedEvent;
      expect(appendCall.version).toBe(3);
    });
  });
});
