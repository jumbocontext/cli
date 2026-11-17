import { AudiencePainUpdatedEventHandler } from "../../../../../../src/application/context/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { IAudiencePainUpdatedProjector } from "../../../../../../src/application/context/audience-pains/update/IAudiencePainUpdatedProjector.js";
import { AudiencePainUpdatedEvent } from "../../../../../../src/domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("AudiencePainUpdatedEventHandler", () => {
  let projector: jest.Mocked<IAudiencePainUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: AudiencePainUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyAudiencePainUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new AudiencePainUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: AudiencePainUpdatedEvent = {
      type: "AudiencePainUpdatedEvent",
      aggregateId: "pain_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { title: "Updated pain" },
    };

    await handler.handle(event);

    expect(projector.applyAudiencePainUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "pain",
      "pain_123",
      "audience pain was updated"
    );
  });
});
