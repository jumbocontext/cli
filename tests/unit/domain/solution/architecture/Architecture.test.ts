/**
 * Tests for Architecture aggregate
 */

import { Architecture } from "../../../../../src/domain/architecture/Architecture.js";
import { ArchitectureEventType } from "../../../../../src/domain/architecture/Constants.js";
import type { ArchitectureState } from "../../../../../src/domain/architecture/Architecture.js";
import { DataStore } from "../../../../../src/domain/architecture/EventIndex.js";

describe("Architecture aggregate", () => {
  describe("define()", () => {
    it("should define architecture with required fields only", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act
      const event = architecture.define(
        "Event-sourced DDD system",
        "Clean Architecture"
      );

      // Assert
      expect(event.type).toBe(ArchitectureEventType.DEFINED);
      expect(event.aggregateId).toBe("architecture");
      expect(event.version).toBe(1);
      expect(event.payload.description).toBe("Event-sourced DDD system");
      expect(event.payload.organization).toBe("Clean Architecture");
      expect(event.payload.patterns).toEqual([]);
      expect(event.payload.principles).toEqual([]);
      expect(event.payload.dataStores).toEqual([]);
      expect(event.payload.stack).toEqual([]);
    });

    it("should define architecture with all optional fields", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const patterns = ["DDD", "CQRS", "Event Sourcing"];
      const principles = ["SOLID", "Clean Code"];
      const dataStores: DataStore[] = [
        { name: "EventStore", type: "JSONL", purpose: "Event persistence" },
        { name: "SQLite", type: "Database", purpose: "Projections" }
      ];
      const stack = ["TypeScript", "Node.js", "SQLite"];

      // Act
      const event = architecture.define(
        "Event-sourced DDD system",
        "Clean Architecture",
        patterns,
        principles,
        dataStores,
        stack
      );

      // Assert
      expect(event.payload.patterns).toEqual(patterns);
      expect(event.payload.principles).toEqual(principles);
      expect(event.payload.dataStores).toEqual(dataStores);
      expect(event.payload.stack).toEqual(stack);
    });

    it("should update state after definition", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act
      architecture.define("Test architecture", "Hexagonal");

      // Assert
      const state = (architecture as unknown as { state: ArchitectureState }).state;
      expect(state.description).toBe("Test architecture");
      expect(state.organization).toBe("Hexagonal");
      expect(state.version).toBe(1);
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act & Assert
      expect(() => architecture.define("", "Clean Architecture")).toThrow(
        "Architecture description must be provided"
      );
    });

    it("should throw error if description is whitespace", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act & Assert
      expect(() => architecture.define("   ", "Clean Architecture")).toThrow(
        "Architecture description must be provided"
      );
    });

    it("should throw error if description exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const longDescription = "A".repeat(501); // Max is 500

      // Act & Assert
      expect(() => architecture.define(longDescription, "Clean Architecture")).toThrow(
        "Architecture description must be less than"
      );
    });

    it("should throw error if organization is empty", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act & Assert
      expect(() => architecture.define("Test", "")).toThrow(
        "Architecture organization must be provided"
      );
    });

    it("should throw error if organization exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const longOrganization = "A".repeat(201); // Max is 200

      // Act & Assert
      expect(() => architecture.define("Test", longOrganization)).toThrow(
        "Architecture organization must be less than"
      );
    });

    it("should throw error if architecture already defined", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("First definition", "Clean Architecture");

      // Act & Assert
      expect(() => architecture.define("Second definition", "Hexagonal")).toThrow(
        "Architecture is already defined"
      );
    });

    it("should throw error if pattern exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const longPattern = "A".repeat(101); // Max is 100

      // Act & Assert
      expect(() =>
        architecture.define("Test", "Clean", [longPattern])
      ).toThrow("Pattern must be less than");
    });

    it("should throw error if too many patterns", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const tooManyPatterns = Array(21).fill("Pattern"); // Max is 20

      // Act & Assert
      expect(() =>
        architecture.define("Test", "Clean", tooManyPatterns)
      ).toThrow("Cannot have more than");
    });

    it("should throw error if principle exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const longPrinciple = "A".repeat(201); // Max is 200

      // Act & Assert
      expect(() =>
        architecture.define("Test", "Clean", undefined, [longPrinciple])
      ).toThrow("Principle must be less than");
    });

    it("should throw error if data store has invalid fields", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const invalidDataStore: DataStore = { name: "", type: "DB", purpose: "Test" };

      // Act & Assert
      expect(() =>
        architecture.define("Test", "Clean", undefined, undefined, [invalidDataStore])
      ).toThrow("Data store name must be provided");
    });

    it("should throw error if stack item exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      const longStackItem = "A".repeat(101); // Max is 100

      // Act & Assert
      expect(() =>
        architecture.define("Test", "Clean", undefined, undefined, undefined, [longStackItem])
      ).toThrow("Stack item must be less than");
    });
  });

  describe("update()", () => {
    it("should update description field only", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Original description", "Clean Architecture");

      // Act
      const event = architecture.update({ description: "Updated description" });

      // Assert
      expect(event.type).toBe(ArchitectureEventType.UPDATED);
      expect(event.aggregateId).toBe("architecture");
      expect(event.version).toBe(2);
      expect(event.payload.description).toBe("Updated description");
      expect(event.payload.organization).toBeUndefined();
    });

    it("should update organization field only", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean Architecture");

      // Act
      const event = architecture.update({ organization: "Hexagonal Architecture" });

      // Assert
      expect(event.type).toBe(ArchitectureEventType.UPDATED);
      expect(event.payload.organization).toBe("Hexagonal Architecture");
      expect(event.payload.description).toBeUndefined();
    });

    it("should update multiple fields", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean Architecture");

      // Act
      const event = architecture.update({
        patterns: ["DDD", "CQRS"],
        principles: ["SOLID"],
        stack: ["TypeScript", "Node.js"]
      });

      // Assert
      expect(event.payload.patterns).toEqual(["DDD", "CQRS"]);
      expect(event.payload.principles).toEqual(["SOLID"]);
      expect(event.payload.stack).toEqual(["TypeScript", "Node.js"]);
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.organization).toBeUndefined();
    });

    it("should update state after update", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Original", "Clean");

      // Act
      architecture.update({ description: "Updated" });

      // Assert
      const state = (architecture as unknown as { state: ArchitectureState }).state;
      expect(state.description).toBe("Updated");
      expect(state.organization).toBe("Clean");
      expect(state.version).toBe(2);
    });

    it("should update dataStores", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean");
      const newDataStores: DataStore[] = [
        { name: "NewDB", type: "PostgreSQL", purpose: "Main storage" }
      ];

      // Act
      const event = architecture.update({ dataStores: newDataStores });

      // Assert
      expect(event.payload.dataStores).toEqual(newDataStores);
    });

    it("should throw error if architecture not yet defined", () => {
      // Arrange
      const architecture = Architecture.create("architecture");

      // Act & Assert
      expect(() => architecture.update({ description: "Test" })).toThrow(
        "Architecture must be defined before updating"
      );
    });

    it("should throw error if updated description is empty", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Original", "Clean");

      // Act & Assert
      expect(() => architecture.update({ description: "" })).toThrow(
        "Architecture description must be provided"
      );
    });

    it("should throw error if updated description exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Original", "Clean");
      const longDescription = "A".repeat(501);

      // Act & Assert
      expect(() => architecture.update({ description: longDescription })).toThrow(
        "Architecture description must be less than"
      );
    });

    it("should throw error if updated organization is empty", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Original");

      // Act & Assert
      expect(() => architecture.update({ organization: "" })).toThrow(
        "Architecture organization must be provided"
      );
    });

    it("should throw error if updated organization exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Original");
      const longOrganization = "A".repeat(201);

      // Act & Assert
      expect(() => architecture.update({ organization: longOrganization })).toThrow(
        "Architecture organization must be less than"
      );
    });

    it("should throw error if updated pattern exceeds max length", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean");
      const longPattern = "A".repeat(101);

      // Act & Assert
      expect(() => architecture.update({ patterns: [longPattern] })).toThrow(
        "Pattern must be less than"
      );
    });

    it("should throw error if too many updated patterns", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean");
      const tooManyPatterns = Array(21).fill("Pattern");

      // Act & Assert
      expect(() => architecture.update({ patterns: tooManyPatterns })).toThrow(
        "Cannot have more than"
      );
    });

    it("should allow empty arrays for optional fields", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean", ["DDD"], ["SOLID"]);

      // Act
      const event = architecture.update({ patterns: [], principles: [] });

      // Assert
      expect(event.payload.patterns).toEqual([]);
      expect(event.payload.principles).toEqual([]);
    });

    it("should increment version with each update", () => {
      // Arrange
      const architecture = Architecture.create("architecture");
      architecture.define("Description", "Clean");

      // Act
      const event1 = architecture.update({ description: "Update 1" });
      const event2 = architecture.update({ description: "Update 2" });

      // Assert
      expect(event1.version).toBe(2);
      expect(event2.version).toBe(3);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild state from event history", () => {
      // Arrange
      const architecture1 = Architecture.create("architecture");
      const event = architecture1.define(
        "Test architecture",
        "Clean Architecture",
        ["DDD"],
        ["SOLID"],
        [{ name: "DB", type: "SQL", purpose: "Store" }],
        ["TypeScript"]
      );

      // Act
      const architecture2 = Architecture.rehydrate("architecture", [event]);

      // Assert
      const state = (architecture2 as unknown as { state: ArchitectureState }).state;
      expect(state.description).toBe("Test architecture");
      expect(state.organization).toBe("Clean Architecture");
      expect(state.patterns).toEqual(["DDD"]);
      expect(state.principles).toEqual(["SOLID"]);
      expect(state.dataStores).toEqual([{ name: "DB", type: "SQL", purpose: "Store" }]);
      expect(state.stack).toEqual(["TypeScript"]);
      expect(state.version).toBe(1);
    });

    it("should handle empty event history", () => {
      // Act
      const architecture = Architecture.rehydrate("architecture", []);

      // Assert
      const state = (architecture as unknown as { state: ArchitectureState }).state;
      expect(state.version).toBe(0);
      expect(state.description).toBe("");
    });

    it("should rebuild state from DEFINED and UPDATED events", () => {
      // Arrange
      const architecture1 = Architecture.create("architecture");
      const definedEvent = architecture1.define("Original", "Clean", ["DDD"]);
      const updatedEvent = architecture1.update({ description: "Updated", patterns: ["CQRS"] });

      // Act
      const architecture2 = Architecture.rehydrate("architecture", [definedEvent, updatedEvent]);

      // Assert
      const state = (architecture2 as unknown as { state: ArchitectureState }).state;
      expect(state.description).toBe("Updated");
      expect(state.organization).toBe("Clean");
      expect(state.patterns).toEqual(["CQRS"]);
      expect(state.version).toBe(2);
    });
  });
});
