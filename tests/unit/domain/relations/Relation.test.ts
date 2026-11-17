/**
 * Tests for Relation aggregate
 */

import { Relation } from "../../../../src/domain/relations/Relation";
import { RelationEventType, EntityType } from "../../../../src/domain/relations/Constants";
import { RelationAddedEvent, RelationDeactivatedEvent, RelationReactivatedEvent } from "../../../../src/domain/relations/EventIndex";

describe("Relation Aggregate", () => {
  describe("add()", () => {
    it("should create RelationAdded event with all required fields", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act
      const event = relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );

      // Assert
      expect(event.type).toBe(RelationEventType.ADDED);
      expect(event.aggregateId).toBe("relation_123");
      expect(event.version).toBe(1);
      expect(event.payload.fromEntityType).toBe(EntityType.GOAL);
      expect(event.payload.fromEntityId).toBe("goal-1");
      expect(event.payload.toEntityType).toBe(EntityType.COMPONENT);
      expect(event.payload.toEntityId).toBe("component-1");
      expect(event.payload.relationType).toBe("involves");
      expect(event.payload.description).toBe("Goal requires this component");
      expect(event.payload.strength).toBe(null);
      expect(event.timestamp).toBeDefined();
    });

    it("should create RelationAdded event with strength", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act
      const event = relation.add(
        EntityType.COMPONENT,
        "comp-1",
        EntityType.DEPENDENCY,
        "dep-1",
        "uses",
        "Component uses this dependency",
        "strong"
      );

      // Assert
      expect(event.payload.strength).toBe("strong");
    });

    it("should throw error if from entity type is invalid", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          "invalid-type" as unknown as EntityType,
          "id-1",
          EntityType.COMPONENT,
          "id-2",
          "involves",
          "Test description"
        )
      ).toThrow(/Source entity type must be one of/);
    });

    it("should throw error if from entity ID is empty", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "",
          EntityType.COMPONENT,
          "id-2",
          "involves",
          "Test description"
        )
      ).toThrow("Source entity ID must be provided");
    });

    it("should throw error if to entity type is invalid", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "id-1",
          "invalid-type" as unknown as EntityType,
          "id-2",
          "involves",
          "Test description"
        )
      ).toThrow(/Target entity type must be one of/);
    });

    it("should throw error if to entity ID is empty", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "id-1",
          EntityType.COMPONENT,
          "",
          "involves",
          "Test description"
        )
      ).toThrow("Target entity ID must be provided");
    });

    it("should throw error if relation type is empty", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "id-1",
          EntityType.COMPONENT,
          "id-2",
          "",
          "Test description"
        )
      ).toThrow("Relation type must be provided");
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "id-1",
          EntityType.COMPONENT,
          "id-2",
          "involves",
          ""
        )
      ).toThrow("Description must be provided");
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const relation = Relation.create("relation_123");
      const longDescription = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "id-1",
          EntityType.COMPONENT,
          "id-2",
          "involves",
          longDescription
        )
      ).toThrow("Description must be less than 500 characters");
    });

    it("should throw error for self-referencing relation (same entity)", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act & Assert
      expect(() =>
        relation.add(
          EntityType.GOAL,
          "same-id",
          EntityType.GOAL,
          "same-id",
          "relates-to",
          "Self reference"
        )
      ).toThrow("Cannot create relation from entity to itself");
    });

    it("should allow different entity IDs of the same type", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act
      const event = relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.GOAL,
        "goal-2",
        "depends-on",
        "Goal depends on another goal"
      );

      // Assert
      expect(event.type).toBe(RelationEventType.ADDED);
      expect(event.payload.fromEntityId).toBe("goal-1");
      expect(event.payload.toEntityId).toBe("goal-2");
    });

    it("should update aggregate state after adding relation", () => {
      // Arrange
      const relation = Relation.create("relation_123");

      // Act
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "comp-1",
        "involves",
        "Test relation"
      );

      // Assert
      const snapshot = relation.snapshot;
      expect(snapshot.fromEntityType).toBe(EntityType.GOAL);
      expect(snapshot.fromEntityId).toBe("goal-1");
      expect(snapshot.toEntityType).toBe(EntityType.COMPONENT);
      expect(snapshot.toEntityId).toBe("comp-1");
      expect(snapshot.version).toBe(1);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const event: RelationAddedEvent = {
        type: "RelationAddedEvent",
        aggregateId: "relation_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          fromEntityType: EntityType.GOAL,
          fromEntityId: "goal-1",
          toEntityType: EntityType.COMPONENT,
          toEntityId: "comp-1",
          relationType: "involves",
          strength: "strong",
          description: "Test relation"
        }
      };

      // Act
      const relation = Relation.rehydrate("relation_123", [event]);

      // Assert
      const snapshot = relation.snapshot;
      expect(snapshot.id).toBe("relation_123");
      expect(snapshot.fromEntityType).toBe(EntityType.GOAL);
      expect(snapshot.fromEntityId).toBe("goal-1");
      expect(snapshot.toEntityType).toBe(EntityType.COMPONENT);
      expect(snapshot.toEntityId).toBe("comp-1");
      expect(snapshot.relationType).toBe("involves");
      expect(snapshot.strength).toBe("strong");
      expect(snapshot.description).toBe("Test relation");
      expect(snapshot.version).toBe(1);
    });
  });

  describe("deactivate() / reactivate()", () => {
    it("should deactivate an active relation", () => {
      const relation = Relation.create("relation_123");
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );

      const event = relation.deactivate("Referenced entity became inactive");

      expect(event.type).toBe(RelationEventType.DEACTIVATED);
      expect(event.aggregateId).toBe("relation_123");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBe("Referenced entity became inactive");
      expect(event.payload.deactivatedAt).toBeDefined();
      expect(relation.snapshot.status).toBe("deactivated");
    });

    it("should reactivate a deactivated relation", () => {
      const relation = Relation.create("relation_123");
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );
      relation.deactivate("Paused");

      const event = relation.reactivate("Dependency restored");

      expect(event.type).toBe(RelationEventType.REACTIVATED);
      expect(event.aggregateId).toBe("relation_123");
      expect(event.version).toBe(3);
      expect(event.payload.reason).toBe("Dependency restored");
      expect(event.payload.reactivatedAt).toBeDefined();
      expect(relation.snapshot.status).toBe("active");
    });

    it("should throw when deactivating a non-active relation", () => {
      const relation = Relation.create("relation_123");
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );
      relation.deactivate("Paused");

      expect(() => relation.deactivate("Again")).toThrow("is not active");
    });

    it("should throw when reactivating a non-deactivated relation", () => {
      const relation = Relation.create("relation_123");
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );

      expect(() => relation.reactivate("Try")).toThrow("is not deactivated");
    });

    it("should not allow deactivate or reactivate after removal", () => {
      const relation = Relation.create("relation_123");
      relation.add(
        EntityType.GOAL,
        "goal-1",
        EntityType.COMPONENT,
        "component-1",
        "involves",
        "Goal requires this component"
      );
      relation.remove("No longer relevant");

      expect(() => relation.deactivate("Try")).toThrow("is not active");
      expect(() => relation.reactivate("Try")).toThrow("is not deactivated");
    });

    it("rehydrates through deactivate and reactivate transitions", () => {
      const addedEvent: RelationAddedEvent = {
        type: RelationEventType.ADDED,
        aggregateId: "relation_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          fromEntityType: EntityType.GOAL,
          fromEntityId: "goal-1",
          toEntityType: EntityType.COMPONENT,
          toEntityId: "comp-1",
          relationType: "involves",
          strength: "strong",
          description: "Test relation"
        }
      };
      const deactivatedEvent: RelationDeactivatedEvent = {
        type: RelationEventType.DEACTIVATED,
        aggregateId: "relation_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          reason: "paused",
          deactivatedAt: "2025-01-01T01:00:00Z"
        }
      };
      const reactivatedEvent: RelationReactivatedEvent = {
        type: RelationEventType.REACTIVATED,
        aggregateId: "relation_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          reason: "restored",
          reactivatedAt: "2025-01-01T02:00:00Z"
        }
      };

      const relation = Relation.rehydrate("relation_123", [addedEvent, deactivatedEvent, reactivatedEvent]);

      expect(relation.snapshot.status).toBe("active");
      expect(relation.snapshot.version).toBe(3);
    });
  });
});
