import { RelationDeactivatedEventHandler } from "../../../../../../src/application/context/relations/deactivate/RelationDeactivatedEventHandler";
import { IRelationDeactivatedProjector } from "../../../../../../src/application/context/relations/deactivate/IRelationDeactivatedProjector";
import { RelationDeactivatedEvent } from "../../../../../../src/domain/relations/deactivate/RelationDeactivatedEvent";
import { RelationEventType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("RelationDeactivatedEventHandler", () => {
  let projector: IRelationDeactivatedProjector;
  let handler: RelationDeactivatedEventHandler;

  beforeEach(() => {
    projector = {
      applyRelationDeactivated: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RelationDeactivatedEventHandler(projector);
  });

  it("delegates deactivated event to projector", async () => {
    const event: RelationDeactivatedEvent = {
      type: RelationEventType.DEACTIVATED,
      aggregateId: "relation_123",
      version: 2,
      timestamp: "2026-03-01T10:00:00.000Z",
      payload: {
        reason: "Decision reversed",
        deactivatedAt: "2026-03-01T10:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyRelationDeactivated).toHaveBeenCalledWith(event);
  });
});
