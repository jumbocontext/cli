import { GuidelineRemovedEventHandler } from "../../../../../../src/application/context/guidelines/remove/GuidelineRemovedEventHandler.js";
import { IGuidelineRemovedProjector } from "../../../../../../src/application/context/guidelines/remove/IGuidelineRemovedProjector.js";
import { GuidelineRemovedEvent } from "../../../../../../src/domain/guidelines/remove/GuidelineRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("GuidelineRemovedEventHandler", () => {
  let projector: jest.Mocked<IGuidelineRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: GuidelineRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyGuidelineRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new GuidelineRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: GuidelineRemovedEvent = {
      type: "GuidelineRemovedEvent",
      aggregateId: "guide_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { removedAt: "2026-03-01T00:00:00.000Z" },
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "guideline",
      "guide_123",
      "guideline was removed"
    );
    expect(projector.applyGuidelineRemoved).toHaveBeenCalledWith(event);
  });
});
