import { RelationReactivatedEventHandler } from "../../../../../../src/application/context/relations/reactivate/RelationReactivatedEventHandler";
import { IRelationReactivatedProjector } from "../../../../../../src/application/context/relations/reactivate/IRelationReactivatedProjector";
import { RelationReactivatedEvent } from "../../../../../../src/domain/relations/reactivate/RelationReactivatedEvent";
import { RelationEventType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("RelationReactivatedEventHandler", () => {
  let projector: IRelationReactivatedProjector;
  let handler: RelationReactivatedEventHandler;

  beforeEach(() => {
    projector = {
      applyRelationReactivated: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RelationReactivatedEventHandler(projector);
  });

  it("delegates reactivated event to projector", async () => {
    const event: RelationReactivatedEvent = {
      type: RelationEventType.REACTIVATED,
      aggregateId: "relation_123",
      version: 3,
      timestamp: "2026-03-01T11:00:00.000Z",
      payload: {
        reason: "Decision restored",
        reactivatedAt: "2026-03-01T11:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyRelationReactivated).toHaveBeenCalledWith(event);
  });
});
