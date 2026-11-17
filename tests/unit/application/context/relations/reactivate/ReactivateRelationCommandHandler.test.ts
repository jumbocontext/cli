import { ReactivateRelationCommandHandler } from "../../../../../../src/application/context/relations/reactivate/ReactivateRelationCommandHandler";
import { IRelationReactivatedEventWriter } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedEventWriter";
import { IRelationReactivatedEventReader } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedEventReader";
import { IRelationReactivatedReader } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { RelationEventType, EntityType } from "../../../../../../src/domain/relations/Constants";
import { RelationAddedEvent, RelationDeactivatedEvent } from "../../../../../../src/domain/relations/EventIndex";
import { jest } from "@jest/globals";

describe("ReactivateRelationCommandHandler", () => {
  let eventWriter: IRelationReactivatedEventWriter;
  let eventReader: IRelationReactivatedEventReader;
  let reader: IRelationReactivatedReader;
  let eventBus: IEventBus;
  let handler: ReactivateRelationCommandHandler;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 3 }),
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

    handler = new ReactivateRelationCommandHandler(eventWriter, eventReader, eventBus, reader);
  });

  it("reactivates an existing deactivated relation and publishes event", async () => {
    const t0 = "2026-03-01T00:00:00.000Z";
    const t1 = "2026-03-01T00:10:00.000Z";
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
      createdAt: t0,
      updatedAt: t1,
    });

    const addedEvent: RelationAddedEvent = {
      type: RelationEventType.ADDED,
      aggregateId: "relation_123",
      version: 1,
      timestamp: t0,
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
    const deactivatedEvent: RelationDeactivatedEvent = {
      type: RelationEventType.DEACTIVATED,
      aggregateId: "relation_123",
      version: 2,
      timestamp: t1,
      payload: {
        reason: "Decision reversed",
        deactivatedAt: t1,
      },
    };
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent, deactivatedEvent]);

    await handler.execute({
      relationId: "relation_123",
      reason: "Decision restored",
    });

    expect(eventReader.readStream).toHaveBeenCalledWith("relation_123");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(RelationEventType.REACTIVATED);
    expect(appendedEvent.payload.reason).toBe("Decision restored");
    expect(eventBus.publish).toHaveBeenCalledWith(appendedEvent);
  });

  it("throws when relation does not exist", async () => {
    (reader.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute({
      relationId: "relation_missing",
      reason: "Decision restored",
    })).rejects.toThrow("does not exist");

    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
