/**
 * Tests for Audience aggregate
 */

import { Audience } from "../../../../../src/domain/audiences/Audience";
import { AudienceEventType } from "../../../../../src/domain/audiences/Constants";
import type { AudiencePriorityType } from "../../../../../src/domain/audiences/Constants";
import {
  AudienceAddedEvent,
  AudienceUpdatedEvent,
} from "../../../../../src/domain/audiences/EventIndex";

describe("Audience Aggregate", () => {
  describe("add()", () => {
    it("should create AudienceAdded event with required fields", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act
      const event = audience.add(
        "Software Developers",
        "Professional developers building LLM-powered applications",
        "primary"
      );

      // Assert
      expect(event.type).toBe(AudienceEventType.ADDED);
      expect(event.aggregateId).toBe("audience-123");
      expect(event.version).toBe(1);
      expect(event.payload.name).toBe("Software Developers");
      expect(event.payload.description).toBe(
        "Professional developers building LLM-powered applications"
      );
      expect(event.payload.priority).toBe("primary");
      expect(event.timestamp).toBeDefined();
    });

    it("should support all three priority levels", () => {
      // Arrange & Act
      const primary = Audience.create("aud-1").add(
        "Primary Audience",
        "Main target",
        "primary"
      );
      const secondary = Audience.create("aud-2").add(
        "Secondary Audience",
        "Secondary target",
        "secondary"
      );
      const tertiary = Audience.create("aud-3").add(
        "Tertiary Audience",
        "Tertiary target",
        "tertiary"
      );

      // Assert
      expect(primary.payload.priority).toBe("primary");
      expect(secondary.payload.priority).toBe("secondary");
      expect(tertiary.payload.priority).toBe("tertiary");
    });

    it("should throw error if audience already exists", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Test Audience", "Test description", "primary");

      // Act & Assert
      expect(() =>
        audience.add("Another Audience", "Another description", "primary")
      ).toThrow("Audience already exists");
    });

    it("should throw error if name is empty", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act & Assert
      expect(() => audience.add("", "Valid description", "primary")).toThrow(
        "Audience name must be provided"
      );
    });

    it("should throw error if name is too long", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      const longName = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() =>
        audience.add(longName, "Valid description", "primary")
      ).toThrow("Audience name must be less than 100 characters");
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act & Assert
      expect(() =>
        audience.add("Valid Name", "", "primary")
      ).toThrow("Audience description must be provided");
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      const longDescription = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() =>
        audience.add("Valid Name", longDescription, "primary")
      ).toThrow("Audience description must be less than 500 characters");
    });

    it("should throw error for invalid priority", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act & Assert
      expect(() =>
        audience.add("Valid Name", "Valid description", "invalid" as unknown as AudiencePriorityType)
      ).toThrow("Priority must be one of: primary, secondary, tertiary");
    });
  });

  describe("update()", () => {
    it("should create AudienceUpdated event with only changed fields", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");

      // Act
      const event = audience.update("Updated Name", undefined, undefined) as AudienceUpdatedEvent;

      // Assert
      expect(event.type).toBe(AudienceEventType.UPDATED);
      expect(event.aggregateId).toBe("audience-123");
      expect(event.version).toBe(2);
      expect(event.payload.name).toBe("Updated Name");
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.priority).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should update multiple fields at once", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");

      // Act
      const event = audience.update(
        "Updated Name",
        "Updated description",
        "secondary"
      ) as AudienceUpdatedEvent;

      // Assert
      expect(event.payload.name).toBe("Updated Name");
      expect(event.payload.description).toBe("Updated description");
      expect(event.payload.priority).toBe("secondary");
      expect(event.version).toBe(2);
    });

    it("should throw error if audience does not exist", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act & Assert
      expect(() =>
        audience.update("Updated Name", undefined, undefined)
      ).toThrow("Audience must exist before updating or removing");
    });

    it("should throw error if no changes detected", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");

      // Act & Assert
      expect(() =>
        audience.update("Software Developers", "Professional developers", "primary")
      ).toThrow("No changes detected for update");
    });

    it("should throw error if name validation fails", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");
      const longName = "a".repeat(101);

      // Act & Assert
      expect(() =>
        audience.update(longName, undefined, undefined)
      ).toThrow("Audience name must be less than 100 characters");
    });

    it("should throw error if description validation fails", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");
      const longDescription = "a".repeat(501);

      // Act & Assert
      expect(() =>
        audience.update(undefined, longDescription, undefined)
      ).toThrow("Audience description must be less than 500 characters");
    });

    it("should throw error for invalid priority", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");

      // Act & Assert
      expect(() =>
        audience.update(undefined, undefined, "invalid" as unknown as AudiencePriorityType)
      ).toThrow("Priority must be one of: primary, secondary, tertiary");
    });

    it("should increment version correctly", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Software Developers", "Professional developers", "primary");

      // Act
      const event1 = audience.update("Updated Name", undefined, undefined);
      const event2 = audience.update(undefined, "Updated description", undefined);

      // Assert
      expect(event1.version).toBe(2);
      expect(event2.version).toBe(3);
    });
  });

  describe("remove()", () => {
    it("should create AudienceRemoved event", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add(
        "Software Developers",
        "Professional developers building LLM-powered applications",
        "primary"
      );

      // Act
      const event = audience.remove();

      // Assert
      expect(event.type).toBe(AudienceEventType.REMOVED);
      expect(event.aggregateId).toBe("audience-123");
      expect(event.version).toBe(2);
      expect(event.payload.name).toBe("Software Developers");
      expect(event.payload.removedReason).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should include removal reason when provided", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Test Audience", "Test description", "primary");

      // Act
      const event = audience.remove("No longer in target market");

      // Assert
      expect(event.payload.removedReason).toBe("No longer in target market");
    });

    it("should throw error if audience does not exist", () => {
      // Arrange
      const audience = Audience.create("audience-123");

      // Act & Assert
      expect(() => audience.remove()).toThrow(
        "Audience must exist before updating or removing"
      );
    });

    it("should throw error if audience is already removed", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Test Audience", "Test description", "primary");
      audience.remove();

      // Act & Assert
      expect(() => audience.remove()).toThrow(
        "Audience has already been removed"
      );
    });

    it("should update aggregate state to isRemoved = true", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Test Audience", "Test description", "primary");

      // Act
      audience.remove();

      // Assert
      const snapshot = audience.snapshot;
      expect(snapshot.isRemoved).toBe(true);
    });

    it("should increment version correctly", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      audience.add("Test Audience", "Test description", "primary");

      // Act
      const event = audience.remove();

      // Assert
      expect(event.version).toBe(2);
      expect(audience.snapshot.version).toBe(2);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild state from event history", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      const event = audience.add(
        "Software Developers",
        "Professional developers",
        "primary"
      );

      // Act
      const rehydrated = Audience.rehydrate("audience-123", [event]);

      // Assert
      const snapshot = rehydrated.snapshot;
      expect(snapshot.id).toBe("audience-123");
      expect(snapshot.name).toBe("Software Developers");
      expect(snapshot.description).toBe("Professional developers");
      expect(snapshot.priority).toBe("primary");
      expect(snapshot.version).toBe(1);
    });

    it("should rebuild state from multiple events including updates", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      const addEvent = audience.add(
        "Software Developers",
        "Professional developers",
        "primary"
      );
      const updateEvent = audience.update("Updated Name", "Updated description", "secondary");

      // Act
      const rehydrated = Audience.rehydrate("audience-123", [addEvent, updateEvent]);

      // Assert
      const snapshot = rehydrated.snapshot;
      expect(snapshot.name).toBe("Updated Name");
      expect(snapshot.description).toBe("Updated description");
      expect(snapshot.priority).toBe("secondary");
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild state from events including removal", () => {
      // Arrange
      const audience = Audience.create("audience-123");
      const addEvent = audience.add(
        "Software Developers",
        "Professional developers",
        "primary"
      );
      const removeEvent = audience.remove("No longer needed");

      // Act
      const rehydrated = Audience.rehydrate("audience-123", [
        addEvent,
        removeEvent,
      ]);

      // Assert
      const snapshot = rehydrated.snapshot;
      expect(snapshot.name).toBe("Software Developers");
      expect(snapshot.isRemoved).toBe(true);
      expect(snapshot.version).toBe(2);
    });
  });
});
