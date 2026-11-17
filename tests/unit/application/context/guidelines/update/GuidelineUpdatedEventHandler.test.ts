import { GuidelineUpdatedEventHandler } from "../../../../../../src/application/context/guidelines/update/GuidelineUpdatedEventHandler.js";
import { IGuidelineUpdatedProjector } from "../../../../../../src/application/context/guidelines/update/IGuidelineUpdatedProjector.js";
import { GuidelineUpdatedEvent } from "../../../../../../src/domain/guidelines/update/GuidelineUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("GuidelineUpdatedEventHandler", () => {
  let projector: jest.Mocked<IGuidelineUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: GuidelineUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyGuidelineUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new GuidelineUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: GuidelineUpdatedEvent = {
      type: "GuidelineUpdatedEvent",
      aggregateId: "guide_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { title: "Updated guideline" },
    };

    await handler.handle(event);

    expect(projector.applyGuidelineUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "guideline",
      "guide_123",
      "guideline was updated"
    );
  });
});
