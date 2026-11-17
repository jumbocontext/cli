import { AudienceRemovedEventHandler } from "../../../../../../src/application/context/audiences/remove/AudienceRemovedEventHandler.js";
import { IAudienceRemovedProjector } from "../../../../../../src/application/context/audiences/remove/IAudienceRemovedProjector.js";
import { AudienceRemovedEvent } from "../../../../../../src/domain/audiences/remove/AudienceRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("AudienceRemovedEventHandler", () => {
  let projector: jest.Mocked<IAudienceRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: AudienceRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyAudienceRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new AudienceRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: AudienceRemovedEvent = {
      type: "AudienceRemovedEvent",
      aggregateId: "aud_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { name: "Removed audience" },
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "audience",
      "aud_123",
      "audience was removed"
    );
    expect(projector.applyAudienceRemoved).toHaveBeenCalledWith(event);
  });
});
