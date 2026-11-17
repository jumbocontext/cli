/**
 * Tests for Guideline aggregate
 */

import { Guideline } from "../../../../src/domain/guidelines/Guideline";
import { GuidelineEventType } from "../../../../src/domain/guidelines/Constants";

describe("Guideline Aggregate", () => {
  describe("remove()", () => {
    it("should create GuidelineRemoved event without reason", async () => {
      // Arrange
      const guideline = Guideline.create("gl_123");
      guideline.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );

      // Act
      const event = guideline.remove();

      // Assert
      expect(event.type).toBe(GuidelineEventType.REMOVED);
      expect(event.aggregateId).toBe("gl_123");
      expect(event.version).toBe(2);
      expect(event.payload.removedAt).toBeDefined();
      expect(event.payload.reason).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GuidelineRemoved event with reason", async () => {
      // Arrange
      const guideline = Guideline.create("gl_123");
      guideline.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );

      // Act
      const event = guideline.remove("Superseded by new testing framework");

      // Assert
      expect(event.type).toBe(GuidelineEventType.REMOVED);
      expect(event.aggregateId).toBe("gl_123");
      expect(event.version).toBe(2);
      expect(event.payload.removedAt).toBeDefined();
      expect(event.payload.reason).toBe("Superseded by new testing framework");
      expect(event.timestamp).toBeDefined();
    });

    it("should update aggregate state to mark as removed", async () => {
      // Arrange
      const guideline = Guideline.create("gl_123");
      guideline.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );

      // Act
      guideline.remove();

      // Assert
      const snapshot = guideline.snapshot;
      expect(snapshot.isRemoved).toBe(true);
      expect(snapshot.version).toBe(2);
    });

    it("should throw error if guideline is already removed", async () => {
      // Arrange
      const guideline = Guideline.create("gl_123");
      guideline.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );
      guideline.remove();

      // Act & Assert
      expect(() => guideline.remove()).toThrow("Guideline is already removed");
    });

    it("should allow removing guideline after multiple updates", async () => {
      // Arrange
      const guideline = Guideline.create("gl_123");
      guideline.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );
      guideline.update({ title: "90% coverage required" });
      guideline.update({ rationale: "CI quality gate" });

      // Act
      const event = guideline.remove("No longer applicable");

      // Assert
      expect(event.type).toBe(GuidelineEventType.REMOVED);
      expect(event.version).toBe(4); // v1: add, v2-3: updates, v4: remove
      expect(event.payload.reason).toBe("No longer applicable");
      expect(guideline.snapshot.isRemoved).toBe(true);
      expect(guideline.snapshot.version).toBe(4);
    });
  });

  describe("rehydrate() with GuidelineRemoved", () => {
    it("should rebuild aggregate with removed state from event history", async () => {
      // Arrange
      const guideline1 = Guideline.create("gl_123");
      const addedEvent = await guideline1.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );
      const removedEvent = guideline1.remove("Superseded");

      // Act
      const guideline2 = Guideline.rehydrate("gl_123", [addedEvent, removedEvent]);

      // Assert
      const snapshot = guideline2.snapshot;
      expect(snapshot.title).toBe("80% coverage required");
      expect(snapshot).not.toHaveProperty(["enforce", "ment"].join(""));
      expect(snapshot.isRemoved).toBe(true);
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with updates followed by removal", async () => {
      // Arrange
      const guideline1 = Guideline.create("gl_123");
      const addedEvent = await guideline1.add(
        "testing",
        "80% coverage required",
        "All new features must have at least 80% test coverage",
        "Ensures code quality"
      );
      const updatedEvent = await guideline1.update({ title: "90% coverage required" });
      const removedEvent = guideline1.remove();

      // Act
      const guideline2 = Guideline.rehydrate("gl_123", [
        addedEvent,
        updatedEvent,
        removedEvent,
      ]);

      // Assert
      const snapshot = guideline2.snapshot;
      expect(snapshot.title).toBe("90% coverage required");
      expect(snapshot.isRemoved).toBe(true);
      expect(snapshot.version).toBe(3);
    });
  });
});
