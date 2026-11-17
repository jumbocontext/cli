import { ValuePropositionRemovedEventHandler } from "../../../../../../src/application/context/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
import { IValuePropositionRemovedProjector } from "../../../../../../src/application/context/value-propositions/remove/IValuePropositionRemovedProjector.js";
import { ValuePropositionRemovedEvent } from "../../../../../../src/domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ValuePropositionRemovedEventHandler", () => {
  let projector: jest.Mocked<IValuePropositionRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ValuePropositionRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyValuePropositionRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ValuePropositionRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: ValuePropositionRemovedEvent = {
      type: "ValuePropositionRemovedEvent",
      aggregateId: "val_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {},
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "value",
      "val_123",
      "value proposition was removed"
    );
    expect(projector.applyValuePropositionRemoved).toHaveBeenCalledWith(event);
  });
});
