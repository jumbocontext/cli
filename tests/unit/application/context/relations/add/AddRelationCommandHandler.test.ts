/**
 * Tests for AddRelationCommandHandler (command handler)
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const { AddRelationCommandHandler } = await import("../../../../../../src/application/context/relations/add/AddRelationCommandHandler");
const { AddRelationCommand } = await import("../../../../../../src/application/context/relations/add/AddRelationCommand");
import type { IRelationAddedEventWriter } from "../../../../../../src/application/context/relations/add/IRelationAddedEventWriter";
import type { IRelationAddedReader } from "../../../../../../src/application/context/relations/add/IRelationAddedReader";
import type { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { RelationEventType, EntityType } from "../../../../../../src/domain/relations/Constants";
import type { RelationView } from "../../../../../../src/application/context/relations/RelationView";

describe("AddRelationCommandHandler", () => {
  let eventWriter: IRelationAddedEventWriter;
  let reader: IRelationAddedReader;
  let eventBus: IEventBus;
  let handler: InstanceType<typeof AddRelationCommandHandler>;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
    };

    // Mock reader
    reader = {
      findByEntities: jest.fn().mockResolvedValue(null),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new AddRelationCommandHandler(eventWriter, eventBus, reader);
  });

  it("should add new relation and publish RelationAdded event", async () => {
    // Arrange
    const command: AddRelationCommand = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      description: "Goal requires this component",
      strength: "strong"
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.relationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // Verify relation uniqueness check
    expect(reader.findByEntities).toHaveBeenCalledWith(
      EntityType.GOAL,
      "goal-1",
      EntityType.COMPONENT,
      "component-1",
      "involves"
    );

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.aggregateId).toBe(result.relationId);
    expect(appendedEvent.type).toBe(RelationEventType.ADDED);
    expect(appendedEvent.payload.fromEntityType).toBe(EntityType.GOAL);
    expect(appendedEvent.payload.fromEntityId).toBe("goal-1");
    expect(appendedEvent.payload.toEntityType).toBe(EntityType.COMPONENT);
    expect(appendedEvent.payload.toEntityId).toBe("component-1");
    expect(appendedEvent.payload.relationType).toBe("involves");
    expect(appendedEvent.payload.description).toBe("Goal requires this component");
    expect(appendedEvent.payload.strength).toBe("strong");

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(RelationEventType.ADDED);
  });

  it("should return existing relation ID when identical relation exists (idempotent)", async () => {
    // Arrange
    const existingView: RelationView = {
      relationId: "relation_existing",
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      strength: "strong",
      description: "Existing description",
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (reader.findByEntities as jest.Mock).mockResolvedValue(existingView);

    const command: AddRelationCommand = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      description: "Same relation again",
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.relationId).toBe("relation_existing");

    // Verify relation existence check
    expect(reader.findByEntities).toHaveBeenCalledWith(
      EntityType.GOAL,
      "goal-1",
      EntityType.COMPONENT,
      "component-1",
      "involves"
    );

    // Verify NO new events were persisted or published
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should add relation without strength parameter", async () => {
    // Arrange
    const command: AddRelationCommand = {
      fromEntityType: EntityType.COMPONENT,
      fromEntityId: "comp-1",
      toEntityType: EntityType.DEPENDENCY,
      toEntityId: "dep-1",
      relationType: "uses",
      description: "Component uses dependency",
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.relationId).toBeDefined();

    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.strength).toBe(null);
  });

  it("should throw error if validation fails (invalid entity type)", async () => {
    // Arrange
    const command: AddRelationCommand = {
      fromEntityType: "invalid-type" as unknown as EntityType,
      fromEntityId: "id-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "id-2",
      relationType: "involves",
      description: "Test description",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(/Source entity type must be one of/);

    // Verify no events were persisted or published
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw error if validation fails (empty description)", async () => {
    // Arrange
    const command: AddRelationCommand = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "id-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "id-2",
      relationType: "involves",
      description: "",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Description must be provided");

    // Verify no events were persisted or published
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw error for self-referencing relation", async () => {
    // Arrange
    const command: AddRelationCommand = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "same-id",
      toEntityType: EntityType.GOAL,
      toEntityId: "same-id",
      relationType: "relates-to",
      description: "Self reference",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Cannot create relation from entity to itself");

    // Verify no events were persisted or published
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
