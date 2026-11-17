import { ValuePropositionUpdatedEventHandler } from "../../../../../../src/application/context/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { IValuePropositionUpdatedProjector } from "../../../../../../src/application/context/value-propositions/update/IValuePropositionUpdatedProjector.js";
import { ValuePropositionUpdatedEvent } from "../../../../../../src/domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ValuePropositionUpdatedEventHandler", () => {
  let projector: jest.Mocked<IValuePropositionUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ValuePropositionUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyValuePropositionUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ValuePropositionUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: ValuePropositionUpdatedEvent = {
      type: "ValuePropositionUpdatedEvent",
      aggregateId: "val_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { title: "Updated value" },
    };

    await handler.handle(event);

    expect(projector.applyValuePropositionUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "value",
      "val_123",
      "value proposition was updated"
    );
  });
});
