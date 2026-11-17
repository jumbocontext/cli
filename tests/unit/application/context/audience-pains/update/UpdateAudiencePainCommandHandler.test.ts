/**
 * Tests for UpdateAudiencePainCommandHandler
 */

import { UpdateAudiencePainCommandHandler } from "../../../../../../src/application/context/audience-pains/update/UpdateAudiencePainCommandHandler.js";
import { UpdateAudiencePainCommand } from "../../../../../../src/application/context/audience-pains/update/UpdateAudiencePainCommand.js";
import { IAudiencePainUpdatedEventWriter } from "../../../../../../src/application/context/audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { IAudiencePainUpdateReader } from "../../../../../../src/application/context/audience-pains/update/IAudiencePainUpdateReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { AudiencePainAddedEvent } from "../../../../../../src/domain/audience-pains/add/AudiencePainAddedEvent.js";
import { AudiencePainUpdatedEvent } from "../../../../../../src/domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import { AudiencePainEventType } from "../../../../../../src/domain/audience-pains/Constants.js";
import { AudiencePainView } from "../../../../../../src/application/context/audience-pains/AudiencePainView.js";
import { jest } from "@jest/globals";

describe("UpdateAudiencePainCommandHandler", () => {
  let handler: UpdateAudiencePainCommandHandler;
  let eventWriter: IAudiencePainUpdatedEventWriter;
  let reader: IAudiencePainUpdateReader;
  let eventBus: IEventBus;

  // Test data
  const painId = "pain_test123";
  const addedEvent: AudiencePainAddedEvent = {
    type: AudiencePainEventType.ADDED,
    aggregateId: painId,
    version: 1,
    timestamp: "2025-11-09T10:00:00Z",
    payload: {
      title: "Context loss",
      description: "LLMs lose context between sessions"
    }
  };

  const existingView: AudiencePainView = {
    painId,
    title: "Context loss",
    description: "LLMs lose context between sessions",
    status: 'active',
    resolvedAt: null,
    version: 1,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T10:00:00Z"
  };

  beforeEach(() => {
    // Create mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn().mockResolvedValue([addedEvent])
    };

    // Create mock reader
    reader = {
      findById: jest.fn().mockResolvedValue(existingView)
    };

    // Create mock event bus
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn()
    };

    // Create handler
    handler = new UpdateAudiencePainCommandHandler(eventWriter, eventBus, reader);
  });

  describe("Successful updates", () => {
    it("should update title only", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Context persistence challenge"
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.painId).toBe(painId);
      expect(reader.findById).toHaveBeenCalledWith(painId);
      expect(eventWriter.readStream).toHaveBeenCalledWith(painId);
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);

      // Verify event structure
      const appendCall = (eventWriter.append as jest.Mock).mock.calls[0][0] as AudiencePainUpdatedEvent;
      expect(appendCall.type).toBe(AudiencePainEventType.UPDATED);
      expect(appendCall.aggregateId).toBe(painId);
      expect(appendCall.version).toBe(2);
      expect(appendCall.payload.title).toBe("Context persistence challenge");
      expect(appendCall.payload.description).toBeUndefined();
    });

    it("should update description only", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        description: "LLMs cannot maintain context across multiple sessions"
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.painId).toBe(painId);

      // Verify event structure
      const appendCall = (eventWriter.append as jest.Mock).mock.calls[0][0] as AudiencePainUpdatedEvent;
      expect(appendCall.type).toBe(AudiencePainEventType.UPDATED);
      expect(appendCall.payload.title).toBeUndefined();
      expect(appendCall.payload.description).toBe(
        "LLMs cannot maintain context across multiple sessions"
      );
    });

    it("should update both title and description", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Updated Title",
        description: "Updated description"
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.painId).toBe(painId);

      // Verify event contains both fields
      const appendCall = (eventWriter.append as jest.Mock).mock.calls[0][0] as AudiencePainUpdatedEvent;
      expect(appendCall.payload.title).toBe("Updated Title");
      expect(appendCall.payload.description).toBe("Updated description");
    });

    it("should rehydrate aggregate from event history", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Updated Title"
      };

      // Act
      await handler.execute(command);

      // Assert - verify readStream was called to get history
      expect(eventWriter.readStream).toHaveBeenCalledWith(painId);
    });

    it("should publish event to event bus", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Updated Title"
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(publishedEvent.type).toBe(AudiencePainEventType.UPDATED);
      expect(publishedEvent.aggregateId).toBe(painId);
    });

    it("should persist event to event store", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Updated Title"
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
      expect(appendedEvent.type).toBe(AudiencePainEventType.UPDATED);
    });
  });

  describe("Error handling", () => {
    it("should throw error when pain not found", async () => {
      // Arrange
      (reader.findById as jest.Mock).mockResolvedValue(null);
      const command: UpdateAudiencePainCommand = {
        painId: "nonexistent-pain",
        title: "Updated Title"
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Audience pain not found"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when no changes provided", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "No changes provided for update"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when title validation fails", async () => {
      // Arrange
      const longTitle = "a".repeat(201); // Max is 200
      const command: UpdateAudiencePainCommand = {
        painId,
        title: longTitle
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Pain title must be less than 200 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when description validation fails", async () => {
      // Arrange
      const longDescription = "a".repeat(2001); // Max is 2000
      const command: UpdateAudiencePainCommand = {
        painId,
        description: longDescription
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Pain description must be less than 2000 characters"
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error when empty title provided", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: ""
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Pain title must be provided"
      );
    });

    it("should throw error when empty description provided", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        description: ""
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Pain description must be provided"
      );
    });
  });

  describe("Event versioning", () => {
    it("should increment version correctly", async () => {
      // Arrange
      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Updated Title"
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock.calls[0][0] as AudiencePainUpdatedEvent;
      expect(appendCall.version).toBe(2); // First version is 1, update is 2
    });

    it("should handle multiple updates with correct versioning", async () => {
      // Arrange - simulate two previous events
      const secondEvent: AudiencePainUpdatedEvent = {
        type: AudiencePainEventType.UPDATED,
        aggregateId: painId,
        version: 2,
        timestamp: "2025-11-09T11:00:00Z",
        payload: {
          title: "First update"
        }
      };
      (eventWriter.readStream as jest.Mock).mockResolvedValue([addedEvent, secondEvent]);

      const command: UpdateAudiencePainCommand = {
        painId,
        title: "Third version"
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendCall = (eventWriter.append as jest.Mock).mock.calls[0][0] as AudiencePainUpdatedEvent;
      expect(appendCall.version).toBe(3);
    });
  });
});
