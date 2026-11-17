import { AudienceUpdatedEventHandler } from "../../../../../../src/application/context/audiences/update/AudienceUpdatedEventHandler.js";
import { IAudienceUpdatedProjector } from "../../../../../../src/application/context/audiences/update/IAudienceUpdatedProjector.js";
import { AudienceUpdatedEvent } from "../../../../../../src/domain/audiences/update/AudienceUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("AudienceUpdatedEventHandler", () => {
  let projector: jest.Mocked<IAudienceUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: AudienceUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyAudienceUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new AudienceUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: AudienceUpdatedEvent = {
      type: "AudienceUpdatedEvent",
      aggregateId: "aud_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { name: "Updated audience" },
    };

    await handler.handle(event);

    expect(projector.applyAudienceUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "audience",
      "aud_123",
      "audience was updated"
    );
  });
});
