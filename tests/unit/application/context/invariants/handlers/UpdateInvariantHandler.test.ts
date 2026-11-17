/**
 * Tests for UpdateInvariantCommandHandler
 */

import { UpdateInvariantCommandHandler } from "../../../../../../src/application/context/invariants/update/UpdateInvariantCommandHandler";
import { UpdateInvariantCommand } from "../../../../../../src/application/context/invariants/update/UpdateInvariantCommand";
import { IInvariantUpdatedEventWriter } from "../../../../../../src/application/context/invariants/update/IInvariantUpdatedEventWriter";
import { IInvariantUpdatedEventReader } from "../../../../../../src/application/context/invariants/update/IInvariantUpdatedEventReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { InvariantEvent, InvariantUpdatedEvent } from "../../../../../../src/domain/invariants/EventIndex";
import { InvariantEventType } from "../../../../../../src/domain/invariants/Constants";
import { jest } from "@jest/globals";

describe("UpdateInvariantCommandHandler", () => {
  let mockEventWriter: jest.Mocked<IInvariantUpdatedEventWriter>;
  let mockEventReader: jest.Mocked<IInvariantUpdatedEventReader>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let handler: UpdateInvariantCommandHandler;

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

    handler = new UpdateInvariantCommandHandler(
      mockEventWriter,
      mockEventReader,
      mockEventBus
    );
  });

  describe("execute()", () => {
    it("should update invariant and publish event", async () => {
      // Arrange
      const addedEvent: InvariantEvent = {
        type: InvariantEventType.ADDED,
        aggregateId: "inv_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          title: "HTTPS only",
          description: "All API calls must use HTTPS",
          rationale: null,
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_123",
        title: "TLS 1.2+ only",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.invariantId).toBe("inv_123");

      // Verify event was appended to event store
      expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as InvariantUpdatedEvent;
      expect(appendedEvent.type).toBe(InvariantEventType.UPDATED);
      expect(appendedEvent.aggregateId).toBe("inv_123");
      expect(appendedEvent.version).toBe(2);
      expect(appendedEvent.payload.title).toBe("TLS 1.2+ only");

      // Verify event was published to event bus
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(appendedEvent);
    });

    it("should update multiple fields", async () => {
      // Arrange
      const addedEvent: InvariantEvent = {
        type: InvariantEventType.ADDED,
        aggregateId: "inv_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          title: "HTTPS only",
          description: "All API calls must use HTTPS",
          rationale: null,
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_123",
        title: "TLS 1.2+ only",
        description: "All API calls must use TLS 1.2 or higher",
        rationale: "Security compliance",
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as InvariantUpdatedEvent;
      expect(appendedEvent.payload.title).toBe("TLS 1.2+ only");
      expect(appendedEvent.payload.description).toBe("All API calls must use TLS 1.2 or higher");
      expect(appendedEvent.payload.rationale).toBe("Security compliance");
    });

    it("should throw error if invariant not found", async () => {
      // Arrange
      mockEventReader.readStream.mockResolvedValue([]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_nonexistent",
        title: "New Title",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow("Invariant not found");
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error if no fields provided", async () => {
      // Arrange
      const addedEvent: InvariantEvent = {
        type: InvariantEventType.ADDED,
        aggregateId: "inv_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          title: "HTTPS only",
          description: "All API calls must use HTTPS",
          rationale: null,
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_123",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "At least one field must be provided to update"
      );
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error if title is invalid", async () => {
      // Arrange
      const addedEvent: InvariantEvent = {
        type: InvariantEventType.ADDED,
        aggregateId: "inv_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          title: "HTTPS only",
          description: "All API calls must use HTTPS",
          rationale: null,
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_123",
        title: "", // Invalid
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Invariant title must be provided"
      );
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should rehydrate aggregate from multiple events", async () => {
      // Arrange
      const addedEvent: InvariantEvent = {
        type: InvariantEventType.ADDED,
        aggregateId: "inv_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          title: "HTTPS only",
          description: "All API calls must use HTTPS",
          rationale: null,
        },
      };

      const firstUpdateEvent: InvariantEvent = {
        type: InvariantEventType.UPDATED,
        aggregateId: "inv_123",
        version: 2,
        timestamp: "2025-01-02T00:00:00.000Z",
        payload: {
          rationale: "Security requirement",
        },
      };

      mockEventReader.readStream.mockResolvedValue([addedEvent, firstUpdateEvent]);

      const command: UpdateInvariantCommand = {
        invariantId: "inv_123",
        title: "TLS 1.2+ only",
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as InvariantUpdatedEvent;
      expect(appendedEvent.version).toBe(3); // Should be version 3 after two previous events
      expect(appendedEvent.payload.title).toBe("TLS 1.2+ only");
    });
  });
});
