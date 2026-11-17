/**
 * Tests for Invariant aggregate
 */

import { Invariant } from "../../../../../src/domain/invariants/Invariant";
import { InvariantEventType } from "../../../../../src/domain/invariants/Constants";

describe("Invariant Aggregate", () => {
  describe("add()", () => {
    it("should create InvariantAdded event with required fields", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");

      // Act
      const event = invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Assert
      expect(event.type).toBe(InvariantEventType.ADDED);
      expect(event.aggregateId).toBe("inv_123");
      expect(event.version).toBe(1);
      expect(event.payload.title).toBe("HTTPS only");
      expect(event.payload.description).toBe("All API calls must use HTTPS");
      expect(event.payload).not.toHaveProperty("en" + "forcement");
      expect(event.payload.rationale).toBeNull();
      expect(event.timestamp).toBeDefined();
    });

    it("should create InvariantAdded event with optional rationale", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");

      // Act
      const event = invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS",
        "Security best practice"
      );

      // Assert
      expect(event.payload.title).toBe("HTTPS only");
      expect(event.payload.description).toBe("All API calls must use HTTPS");
      expect(event.payload).not.toHaveProperty("en" + "forcement");
      expect(event.payload.rationale).toBe("Security best practice");
    });

    it("should throw error if title is empty", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");

      // Act & Assert
      expect(() =>
        invariant.add("", "Some description")
      ).toThrow("Invariant title must be provided");
    });

    it("should throw error if title is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      const longTitle = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() =>
        invariant.add(longTitle, "Some description")
      ).toThrow("Invariant title must be less than 100 characters");
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");

      // Act & Assert
      expect(() =>
        invariant.add("HTTPS only", "")
      ).toThrow("Invariant description must be provided");
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      const longDescription = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() =>
        invariant.add("HTTPS only", longDescription)
      ).toThrow("Invariant description must be less than 1000 characters");
    });

    it("should throw error if rationale is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      const longRationale = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() =>
        invariant.add(
          "HTTPS only",
          "Some description",
          longRationale
        )
      ).toThrow("Rationale must be less than 1000 characters");
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");

      // Act
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS",
        "Security best practice"
      );

      // Assert
      const snapshot = invariant.snapshot;
      expect(snapshot.title).toBe("HTTPS only");
      expect(snapshot.description).toBe("All API calls must use HTTPS");
      expect(snapshot).not.toHaveProperty("en" + "forcement");
      expect(snapshot.rationale).toBe("Security best practice");
      expect(snapshot.version).toBe(1);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const invariant1 = Invariant.create("inv_123");
      const event = invariant1.add(
        "HTTPS only",
        "All API calls must use HTTPS",
        "Security best practice"
      );

      // Act
      const invariant2 = Invariant.rehydrate("inv_123", [event]);

      // Assert
      const snapshot = invariant2.snapshot;
      expect(snapshot.title).toBe("HTTPS only");
      expect(snapshot.description).toBe("All API calls must use HTTPS");
      expect(snapshot).not.toHaveProperty("en" + "forcement");
      expect(snapshot.rationale).toBe("Security best practice");
      expect(snapshot.version).toBe(1);
    });
  });

  describe("update()", () => {
    it("should create InvariantUpdated event when updating single field", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act
      const event = invariant.update({ title: "TLS 1.2+ only" });

      // Assert
      expect(event.type).toBe(InvariantEventType.UPDATED);
      expect(event.aggregateId).toBe("inv_123");
      expect(event.version).toBe(2);
      expect(event.payload.title).toBe("TLS 1.2+ only");
      expect(event.payload.description).toBeUndefined();
      expect(event.payload).not.toHaveProperty("en" + "forcement");
      expect(event.payload.rationale).toBeUndefined();
    });

    it("should create InvariantUpdated event when updating multiple fields", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act
      const event = invariant.update({
        title: "TLS 1.2+ only",
        description: "All API calls must use TLS 1.2 or higher",
        rationale: "Security compliance requirement"
      });

      // Assert
      expect(event.type).toBe(InvariantEventType.UPDATED);
      expect(event.version).toBe(2);
      expect(event.payload.title).toBe("TLS 1.2+ only");
      expect(event.payload.description).toBe("All API calls must use TLS 1.2 or higher");
      expect(event.payload.rationale).toBe("Security compliance requirement");
      expect(event.payload).not.toHaveProperty("en" + "forcement");
    });

    it("should update aggregate state after update event", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS",
        "Security"
      );

      // Act
      invariant.update({ title: "TLS 1.2+ only" });

      // Assert
      const snapshot = invariant.snapshot;
      expect(snapshot.title).toBe("TLS 1.2+ only");
      expect(snapshot.description).toBe("All API calls must use HTTPS"); // unchanged
      expect(snapshot).not.toHaveProperty("en" + "forcement");
      expect(snapshot.rationale).toBe("Security"); // unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should throw error if no fields provided", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act & Assert
      expect(() => invariant.update({})).toThrow(
        "At least one field must be provided to update"
      );
    });

    it("should throw error if updated title is empty", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act & Assert
      expect(() => invariant.update({ title: "" })).toThrow(
        "Invariant title must be provided"
      );
    });

    it("should throw error if updated title is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );
      const longTitle = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() => invariant.update({ title: longTitle })).toThrow(
        "Invariant title must be less than 100 characters"
      );
    });

    it("should throw error if updated description is empty", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act & Assert
      expect(() => invariant.update({ description: "" })).toThrow(
        "Invariant description must be provided"
      );
    });

    it("should throw error if updated description is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );
      const longDescription = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() => invariant.update({ description: longDescription })).toThrow(
        "Invariant description must be less than 1000 characters"
      );
    });

    it("should throw error if updated rationale is too long", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );
      const longRationale = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() => invariant.update({ rationale: longRationale })).toThrow(
        "Rationale must be less than 1000 characters"
      );
    });

    it("should allow setting rationale to null", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS",
        "Security requirement"
      );

      // Act
      const event = invariant.update({ rationale: null });

      // Assert
      expect(event.payload.rationale).toBeNull();
      expect(invariant.snapshot.rationale).toBeNull();
    });

    it("should support multiple sequential updates", () => {
      // Arrange
      const invariant = Invariant.create("inv_123");
      invariant.add(
        "HTTPS only",
        "All API calls must use HTTPS"
      );

      // Act
      invariant.update({ title: "TLS 1.2+ only" });
      invariant.update({ description: "All API calls must use TLS 1.2 or higher" });
      invariant.update({ rationale: "Security compliance" });

      // Assert
      const snapshot = invariant.snapshot;
      expect(snapshot.title).toBe("TLS 1.2+ only");
      expect(snapshot.description).toBe("All API calls must use TLS 1.2 or higher");
      expect(snapshot.rationale).toBe("Security compliance");
      expect(snapshot.version).toBe(4); // v1: add, v2-4: three updates
    });
  });
});
