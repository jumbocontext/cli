/**
 * Tests for ValueProposition aggregate
 */

import { ValueProposition } from "../../../../../src/domain/value-propositions/ValueProposition";
import { ValuePropositionEventType } from "../../../../../src/domain/value-propositions/Constants";
import {
  ValuePropositionAddedEvent,
  ValuePropositionUpdatedEvent,
  ValuePropositionRemovedEvent,
} from "../../../../../src/domain/value-propositions/EventIndex";

describe("ValueProposition Aggregate", () => {
  describe("add()", () => {
    it("should create ValuePropositionAdded event with required fields", () => {
      // Arrange
      const value = ValueProposition.create("value_123");

      // Act
      const event = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Assert
      expect(event.type).toBe(ValuePropositionEventType.ADDED);
      expect(event.aggregateId).toBe("value_123");
      expect(event.version).toBe(1);
      expect(event.payload.title).toBe("Persistent context");
      expect(event.payload.description).toBe("Maintain context across sessions");
      expect(event.payload.benefit).toBe("Developers don't lose work");
      expect(event.payload.measurableOutcome).toBe(null);
      expect(event.timestamp).toBeDefined();
    });

    it("should create ValuePropositionAdded event with measurable outcome", () => {
      // Arrange
      const value = ValueProposition.create("value_123");

      // Act
      const event = value.add(
        "Model-agnostic",
        "Works with any LLM provider",
        "Switch providers freely",
        "Zero context loss on switch"
      );

      // Assert
      expect(event.payload.measurableOutcome).toBe("Zero context loss on switch");
    });

    it("should throw error if title is empty", () => {
      // Arrange
      const value = ValueProposition.create("value_123");

      // Act & Assert
      expect(() =>
        value.add("", "Valid description", "Valid benefit")
      ).toThrow("Value proposition title must be provided");
    });

    it("should throw error if title is too long", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const longTitle = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() =>
        value.add(longTitle, "Valid description", "Valid benefit")
      ).toThrow("Title must be less than 100 characters");
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const value = ValueProposition.create("value_123");

      // Act & Assert
      expect(() => value.add("Valid title", "", "Valid benefit")).toThrow(
        "Description must be provided"
      );
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const longDescription = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() =>
        value.add("Valid title", longDescription, "Valid benefit")
      ).toThrow("Description must be less than 1000 characters");
    });

    it("should throw error if benefit is empty", () => {
      // Arrange
      const value = ValueProposition.create("value_123");

      // Act & Assert
      expect(() =>
        value.add("Valid title", "Valid description", "")
      ).toThrow("Benefit must be provided");
    });

    it("should throw error if benefit is too long", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const longBenefit = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() =>
        value.add("Valid title", "Valid description", longBenefit)
      ).toThrow("Benefit must be less than 500 characters");
    });

    it("should throw error if measurable outcome is too long", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const longOutcome = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() =>
        value.add(
          "Valid title",
          "Valid description",
          "Valid benefit",
          longOutcome
        )
      ).toThrow("Measurable outcome must be less than 500 characters");
    });
  });

  describe("update()", () => {
    it("should create ValuePropositionUpdated event with only title change", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.update(
        "Updated title",
        undefined,
        undefined,
        undefined
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.type).toBe(ValuePropositionEventType.UPDATED);
      expect(event.aggregateId).toBe("value_123");
      expect(event.version).toBe(2);
      expect(event.payload.title).toBe("Updated title");
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.benefit).toBeUndefined();
      expect(event.payload.measurableOutcome).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create ValuePropositionUpdated event with only description change", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.update(
        undefined,
        "Updated description",
        undefined,
        undefined
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.type).toBe(ValuePropositionEventType.UPDATED);
      expect(event.version).toBe(2);
      expect(event.payload.title).toBeUndefined();
      expect(event.payload.description).toBe("Updated description");
      expect(event.payload.benefit).toBeUndefined();
      expect(event.payload.measurableOutcome).toBeUndefined();
    });

    it("should create ValuePropositionUpdated event with only benefit change", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.update(
        undefined,
        undefined,
        "Updated benefit",
        undefined
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.type).toBe(ValuePropositionEventType.UPDATED);
      expect(event.version).toBe(2);
      expect(event.payload.title).toBeUndefined();
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.benefit).toBe("Updated benefit");
      expect(event.payload.measurableOutcome).toBeUndefined();
    });

    it("should update multiple fields at once", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.update(
        "New title",
        "New description",
        "New benefit",
        undefined
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.payload.title).toBe("New title");
      expect(event.payload.description).toBe("New description");
      expect(event.payload.benefit).toBe("New benefit");
      expect(event.version).toBe(2);
    });

    it("should allow setting measurable outcome", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.update(
        undefined,
        undefined,
        undefined,
        "Zero context loss"
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.payload.measurableOutcome).toBe("Zero context loss");
    });

    it("should allow clearing measurable outcome", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work",
        "Zero context loss"
      );

      // Act
      const event = value.update(
        undefined,
        undefined,
        undefined,
        null
      ) as ValuePropositionUpdatedEvent;

      // Assert
      expect(event.payload.measurableOutcome).toBe(null);
    });

    it("should throw error when no changes provided", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act & Assert
      expect(() =>
        value.update(undefined, undefined, undefined, undefined)
      ).toThrow("At least one field must be provided for update");
    });

    it("should throw error if title validation fails", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const longTitle = "a".repeat(101);

      // Act & Assert
      expect(() =>
        value.update(longTitle, undefined, undefined, undefined)
      ).toThrow("Title must be less than 100 characters");
    });

    it("should throw error if description validation fails", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const longDescription = "a".repeat(1001);

      // Act & Assert
      expect(() =>
        value.update(undefined, longDescription, undefined, undefined)
      ).toThrow("Description must be less than 1000 characters");
    });

    it("should throw error if benefit validation fails", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const longBenefit = "a".repeat(501);

      // Act & Assert
      expect(() =>
        value.update(undefined, undefined, longBenefit, undefined)
      ).toThrow("Benefit must be less than 500 characters");
    });

    it("should throw error if measurable outcome validation fails", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const longOutcome = "a".repeat(501);

      // Act & Assert
      expect(() =>
        value.update(undefined, undefined, undefined, longOutcome)
      ).toThrow("Measurable outcome must be less than 500 characters");
    });

    it("should throw error if empty title provided", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act & Assert
      expect(() => value.update("", undefined, undefined, undefined)).toThrow(
        "Value proposition title must be provided"
      );
    });

    it("should throw error if empty description provided", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act & Assert
      expect(() =>
        value.update(undefined, "", undefined, undefined)
      ).toThrow("Description must be provided");
    });

    it("should throw error if empty benefit provided", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act & Assert
      expect(() =>
        value.update(undefined, undefined, "", undefined)
      ).toThrow("Benefit must be provided");
    });

    it("should increment version correctly on update", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const addEvent = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const updateEvent = value.update("Updated title", undefined, undefined);

      // Assert
      expect(addEvent.version).toBe(1);
      expect(updateEvent.version).toBe(2);
    });
  });

  describe("remove()", () => {
    it("should create ValuePropositionRemoved event", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const event = value.remove();

      // Assert
      expect(event.type).toBe(ValuePropositionEventType.REMOVED);
      expect(event.aggregateId).toBe("value_123");
      expect(event.version).toBe(2);
      expect(event.payload).toEqual({});
      expect(event.timestamp).toBeDefined();
    });

    it("should increment version correctly on remove", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const addEvent = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const updateEvent = value.update("Updated title", undefined, undefined);

      // Act
      const removeEvent = value.remove();

      // Assert
      expect(addEvent.version).toBe(1);
      expect(updateEvent.version).toBe(2);
      expect(removeEvent.version).toBe(3);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild state from add event", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const addEvent = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );

      // Act
      const rehydrated = ValueProposition.rehydrate("value_123", [addEvent]);

      // Assert - verify by calling update (which requires existing state)
      const updateEvent = rehydrated.update("Updated", undefined, undefined);
      expect(updateEvent.version).toBe(2);
    });

    it("should rebuild state from add and update events", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const addEvent = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const updateEvent1 = value.update("Updated title", undefined, undefined);
      const updateEvent2 = value.update(
        undefined,
        "Updated description",
        undefined
      );

      // Act
      const rehydrated = ValueProposition.rehydrate("value_123", [
        addEvent,
        updateEvent1,
        updateEvent2,
      ]);

      // Assert - verify by checking next version
      const nextUpdate = rehydrated.update(
        "Another update",
        undefined,
        undefined
      );
      expect(nextUpdate.version).toBe(4);
    });

    it("should rebuild state including removed events", () => {
      // Arrange
      const value = ValueProposition.create("value_123");
      const addEvent = value.add(
        "Persistent context",
        "Maintain context across sessions",
        "Developers don't lose work"
      );
      const removeEvent = value.remove();

      // Act
      const rehydrated = ValueProposition.rehydrate("value_123", [
        addEvent,
        removeEvent,
      ]);

      // Assert - verify version is correct after rehydration
      const updateEvent = rehydrated.update("Updated", undefined, undefined);
      expect(updateEvent.version).toBe(3);
    });
  });
});
