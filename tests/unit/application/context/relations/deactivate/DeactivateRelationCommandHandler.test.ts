import { DeactivateRelationCommandHandler } from "../../../../../../src/application/context/relations/deactivate/DeactivateRelationCommandHandler";
import { IRelationDeactivatedEventWriter } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedEventWriter";
import { IRelationDeactivatedEventReader } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedEventReader";
import { IRelationDeactivatedReader } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { RelationEventType, EntityType } from "../../../../../../src/domain/relations/Constants";
import { RelationAddedEvent } from "../../../../../../src/domain/relations/EventIndex";
import { jest } from "@jest/globals";

describe("DeactivateRelationCommandHandler", () => {
  let eventWriter: IRelationDeactivatedEventWriter;
  let eventReader: IRelationDeactivatedEventReader;
  let reader: IRelationDeactivatedReader;
  let eventBus: IEventBus;
  let handler: DeactivateRelationCommandHandler;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 2 }),
    };
    eventReader = {
      readStream: jest.fn().mockResolvedValue([]),
    };
    reader = {
      findById: jest.fn().mockResolvedValue(null),
    };
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new DeactivateRelationCommandHandler(eventWriter, eventReader, eventBus, reader);
  });

  it("deactivates an existing active relation and publishes event", async () => {
    const existingCreatedAt = "2026-03-01T00:00:00.000Z";
    (reader.findById as jest.Mock).mockResolvedValue({
      relationId: "relation_123",
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      strength: null,
      description: "Goal requires component",
      status: "active",
      version: 1,
      createdAt: existingCreatedAt,
      updatedAt: existingCreatedAt,
    });

    const addedEvent: RelationAddedEvent = {
      type: RelationEventType.ADDED,
      aggregateId: "relation_123",
      version: 1,
      timestamp: existingCreatedAt,
      payload: {
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal-1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "component-1",
        relationType: "involves",
        strength: null,
        description: "Goal requires component",
      },
    };
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent]);

    await handler.execute({
      relationId: "relation_123",
      reason: "Decision reversed",
    });

    expect(eventReader.readStream).toHaveBeenCalledWith("relation_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(RelationEventType.DEACTIVATED);
    expect(appendedEvent.payload.reason).toBe("Decision reversed");
    expect(eventBus.publish).toHaveBeenCalledWith(appendedEvent);
  });

  it("throws when relation does not exist", async () => {
    (reader.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute({
      relationId: "relation_missing",
      reason: "Decision reversed",
    })).rejects.toThrow("does not exist");

    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("silently skips when relation is already deactivated", async () => {
    (reader.findById as jest.Mock).mockResolvedValue({
      relationId: "relation_123",
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      strength: null,
      description: "Goal requires component",
      status: "deactivated",
      version: 2,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T01:00:00.000Z",
    });

    await handler.execute({
      relationId: "relation_123",
      reason: "Decision reversed",
    });

    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("silently skips when relation is already removed", async () => {
    (reader.findById as jest.Mock).mockResolvedValue({
      relationId: "relation_123",
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal-1",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "component-1",
      relationType: "involves",
      strength: null,
      description: "Goal requires component",
      status: "removed",
      version: 3,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T02:00:00.000Z",
    });

    await handler.execute({
      relationId: "relation_123",
      reason: "Decision reversed",
    });

    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
