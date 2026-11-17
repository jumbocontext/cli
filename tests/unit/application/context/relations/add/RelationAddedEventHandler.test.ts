/**
 * Tests for RelationAddedEventHandler (projection handler)
 */

import { RelationAddedEventHandler } from "../../../../../../src/application/context/relations/add/RelationAddedEventHandler";
import { IRelationAddedProjector } from "../../../../../../src/application/context/relations/add/IRelationAddedProjector";
import { RelationAddedEvent } from "../../../../../../src/domain/relations/add/RelationAddedEvent";
import { RelationEventType, EntityType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("RelationAddedEventHandler", () => {
  let projector: IRelationAddedProjector;
  let handler: RelationAddedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyRelationAdded: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RelationAddedEventHandler(projector);
  });

  it("should delegate RelationAddedEvent event to projector", async () => {
    // Arrange
    const event: RelationAddedEvent = {
      type: RelationEventType.ADDED,
      aggregateId: "relation_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal-1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "component-1",
        relationType: "involves",
        strength: "strong",
        description: "Goal requires this component"
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyRelationAdded).toHaveBeenCalledTimes(1);
    expect(projector.applyRelationAdded).toHaveBeenCalledWith(event);
  });

  it("should handle RelationAddedEvent event without strength", async () => {
    // Arrange
    const event: RelationAddedEvent = {
      type: RelationEventType.ADDED,
      aggregateId: "relation_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: "comp-1",
        toEntityType: EntityType.DEPENDENCY,
        toEntityId: "dep-1",
        relationType: "uses",
        strength: null,
        description: "Component uses dependency"
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyRelationAdded).toHaveBeenCalledTimes(1);
    expect(projector.applyRelationAdded).toHaveBeenCalledWith(event);
  });
});
