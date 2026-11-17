/**
 * Tests for AudiencePain aggregate
 */

import { AudiencePain } from "../../../../../src/domain/audience-pains/AudiencePain";
import { AudiencePainEventType } from "../../../../../src/domain/audience-pains/Constants";
import {
  AudiencePainAddedEvent,
  AudiencePainUpdatedEvent,
} from "../../../../../src/domain/audience-pains/EventIndex";

describe("AudiencePain Aggregate", () => {
  describe("add()", () => {
    it("should create AudiencePainAdded event with required fields", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");

      // Act
      const event = pain.add(
        "Context loss",
        "LLMs lose context between sessions"
      );

      // Assert
      expect(event.type).toBe(AudiencePainEventType.ADDED);
      expect(event.aggregateId).toBe("pain-123");
      expect(event.version).toBe(1);
      expect(event.payload.title).toBe("Context loss");
      expect(event.payload.description).toBe(
        "LLMs lose context between sessions"
      );
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if title is empty", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");

      // Act & Assert
      expect(() => pain.add("", "Valid description")).toThrow(
        "Pain title must be provided"
      );
    });

    it("should throw error if title is too long", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      const longTitle = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => pain.add(longTitle, "Valid description")).toThrow(
        "Pain title must be less than 200 characters"
      );
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");

      // Act & Assert
      expect(() => pain.add("Valid Title", "")).toThrow(
        "Pain description must be provided"
      );
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      const longDescription = "a".repeat(2001); // Max is 2000

      // Act & Assert
      expect(() => pain.add("Valid Title", longDescription)).toThrow(
        "Pain description must be less than 2000 characters"
      );
    });
  });

  describe("update()", () => {
    it("should create AudiencePainUpdated event with only title change", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act
      const event = pain.update(
        "Context persistence challenge",
        undefined
      ) as AudiencePainUpdatedEvent;

      // Assert
      expect(event.type).toBe(AudiencePainEventType.UPDATED);
      expect(event.aggregateId).toBe("pain-123");
      expect(event.version).toBe(2);
      expect(event.payload.title).toBe("Context persistence challenge");
      expect(event.payload.description).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create AudiencePainUpdated event with only description change", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act
      const event = pain.update(
        undefined,
        "LLMs cannot maintain context across multiple sessions"
      ) as AudiencePainUpdatedEvent;

      // Assert
      expect(event.type).toBe(AudiencePainEventType.UPDATED);
      expect(event.aggregateId).toBe("pain-123");
      expect(event.version).toBe(2);
      expect(event.payload.title).toBeUndefined();
      expect(event.payload.description).toBe(
        "LLMs cannot maintain context across multiple sessions"
      );
      expect(event.timestamp).toBeDefined();
    });

    it("should update both title and description at once", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act
      const event = pain.update(
        "Updated Title",
        "Updated description"
      ) as AudiencePainUpdatedEvent;

      // Assert
      expect(event.payload.title).toBe("Updated Title");
      expect(event.payload.description).toBe("Updated description");
      expect(event.version).toBe(2);
    });

    it("should throw error when no changes provided", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act & Assert
      expect(() => pain.update(undefined, undefined)).toThrow(
        "No changes provided for update"
      );
    });

    it("should throw error if title validation fails", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");
      const longTitle = "a".repeat(201);

      // Act & Assert
      expect(() => pain.update(longTitle, undefined)).toThrow(
        "Pain title must be less than 200 characters"
      );
    });

    it("should throw error if description validation fails", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");
      const longDescription = "a".repeat(2001);

      // Act & Assert
      expect(() => pain.update(undefined, longDescription)).toThrow(
        "Pain description must be less than 2000 characters"
      );
    });

    it("should throw error if empty title provided", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act & Assert
      expect(() => pain.update("", undefined)).toThrow(
        "Pain title must be provided"
      );
    });

    it("should throw error if empty description provided", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      pain.add("Context loss", "LLMs lose context between sessions");

      // Act & Assert
      expect(() => pain.update(undefined, "")).toThrow(
        "Pain description must be provided"
      );
    });

    it("should increment version correctly on update", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      const addEvent = pain.add("Context loss", "LLMs lose context");

      // Act
      const updateEvent = pain.update("Updated Title", undefined);

      // Assert
      expect(addEvent.version).toBe(1);
      expect(updateEvent.version).toBe(2);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild state from add event", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      const addEvent = pain.add("Context loss", "LLMs lose context");

      // Act
      const rehydrated = AudiencePain.rehydrate("pain-123", [addEvent]);

      // Assert - verify by calling update (which requires existing state)
      const updateEvent = rehydrated.update("Updated", undefined);
      expect(updateEvent.version).toBe(2);
    });

    it("should rebuild state from add and update events", () => {
      // Arrange
      const pain = AudiencePain.create("pain-123");
      const addEvent = pain.add("Context loss", "LLMs lose context");
      const updateEvent1 = pain.update("Updated Title", undefined);
      const updateEvent2 = pain.update(undefined, "Updated description");

      // Act
      const rehydrated = AudiencePain.rehydrate("pain-123", [
        addEvent,
        updateEvent1,
        updateEvent2,
      ]);

      // Assert - verify by checking next version
      const nextUpdate = rehydrated.update("Another update", undefined);
      expect(nextUpdate.version).toBe(4);
    });
  });
});
