/**
 * Tests for RemoveGuidelineCommandHandler
 */

import { RemoveGuidelineCommandHandler } from "../../../../src/application/context/guidelines/remove/RemoveGuidelineCommandHandler";
import { RemoveGuidelineCommand } from "../../../../src/application/context/guidelines/remove/RemoveGuidelineCommand";
import { IGuidelineRemovedEventWriter } from "../../../../src/application/context/guidelines/remove/IGuidelineRemovedEventWriter";
import { IGuidelineRemovedEventReader } from "../../../../src/application/context/guidelines/remove/IGuidelineRemovedEventReader";
import { IEventBus } from "../../../../src/application/messaging/IEventBus";
import { GuidelineEvent, GuidelineRemovedEvent } from "../../../../src/domain/guidelines/EventIndex";
import { GuidelineEventType } from "../../../../src/domain/guidelines/Constants";
import { jest } from "@jest/globals";

describe("RemoveGuidelineCommandHandler", () => {
  let mockEventWriter: jest.Mocked<IGuidelineRemovedEventWriter>;
  let mockEventReader: jest.Mocked<IGuidelineRemovedEventReader>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let handler: RemoveGuidelineCommandHandler;

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn(),
    };

    mockEventReader = {
      readStream: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    handler = new RemoveGuidelineCommandHandler(
      mockEventWriter,
      mockEventReader,
      mockEventBus
    );
  });

  describe("execute()", () => {
    it("should remove guideline without reason and publish event", async () => {
      // Arrange
      const addedEvent: GuidelineEvent = {
        type: GuidelineEventType.ADDED,
        aggregateId: "gl_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          category: "testing",
          title: "80% coverage required",
          description: "All new features must have at least 80% test coverage",
          rationale: "Ensures code quality",
          enforcement: "Pre-commit hook",
          examples: [],
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: RemoveGuidelineCommand = {
        guidelineId: "gl_123",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.guidelineId).toBe("gl_123");

      // Verify event was appended to event store
      expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as GuidelineRemovedEvent;
      expect(appendedEvent.type).toBe(GuidelineEventType.REMOVED);
      expect(appendedEvent.aggregateId).toBe("gl_123");
      expect(appendedEvent.version).toBe(2);
      expect(appendedEvent.payload.removedAt).toBeDefined();
      expect(appendedEvent.payload.reason).toBeUndefined();

      // Verify event was published to event bus
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(appendedEvent);
    });

    it("should remove guideline with reason and publish event", async () => {
      // Arrange
      const addedEvent: GuidelineEvent = {
        type: GuidelineEventType.ADDED,
        aggregateId: "gl_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          category: "testing",
          title: "80% coverage required",
          description: "All new features must have at least 80% test coverage",
          rationale: "Ensures code quality",
          enforcement: "Pre-commit hook",
          examples: [],
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: RemoveGuidelineCommand = {
        guidelineId: "gl_123",
        reason: "Superseded by new testing framework",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.guidelineId).toBe("gl_123");

      // Verify event was appended with reason
      expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as GuidelineRemovedEvent;
      expect(appendedEvent.type).toBe(GuidelineEventType.REMOVED);
      expect(appendedEvent.payload.reason).toBe("Superseded by new testing framework");

      // Verify event was published to event bus
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it("should remove guideline after multiple updates", async () => {
      // Arrange
      const addedEvent: GuidelineEvent = {
        type: GuidelineEventType.ADDED,
        aggregateId: "gl_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          category: "testing",
          title: "80% coverage required",
          description: "All new features must have at least 80% test coverage",
          rationale: "Ensures code quality",
          enforcement: "Pre-commit hook",
          examples: [],
        },
      };

      const updatedEvent: GuidelineEvent = {
        type: GuidelineEventType.UPDATED,
        aggregateId: "gl_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00.000Z",
        payload: {
          title: "90% coverage required",
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent, updatedEvent]);

      const command: RemoveGuidelineCommand = {
        guidelineId: "gl_123",
        reason: "No longer applicable",
      };

      // Act
      await handler.execute(command);

      // Assert
      expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as GuidelineRemovedEvent;
      expect(appendedEvent.version).toBe(3); // v1: add, v2: update, v3: remove
      expect(appendedEvent.payload.reason).toBe("No longer applicable");
    });

    it("should throw error if guideline does not exist", async () => {
      // Arrange
      mockEventReader.readStream.mockResolvedValue([]);

      const command: RemoveGuidelineCommand = {
        guidelineId: "non-existent",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Guideline with ID non-existent not found"
      );

      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error if guideline is already removed", async () => {
      // Arrange
      const addedEvent: GuidelineEvent = {
        type: GuidelineEventType.ADDED,
        aggregateId: "gl_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          category: "testing",
          title: "80% coverage required",
          description: "All new features must have at least 80% test coverage",
          rationale: "Ensures code quality",
          enforcement: "Pre-commit hook",
          examples: [],
        },
      };

      const removedEvent: GuidelineEvent = {
        type: GuidelineEventType.REMOVED,
        aggregateId: "gl_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00.000Z",
        payload: {
          removedAt: "2025-01-01T01:00:00.000Z",
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent, removedEvent]);

      const command: RemoveGuidelineCommand = {
        guidelineId: "gl_123",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Guideline is already removed"
      );

      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error if guideline ID is empty", async () => {
      // Arrange
      const command: RemoveGuidelineCommand = {
        guidelineId: "",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Guideline ID must be provided"
      );

      expect(mockEventReader.readStream).not.toHaveBeenCalled();
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
