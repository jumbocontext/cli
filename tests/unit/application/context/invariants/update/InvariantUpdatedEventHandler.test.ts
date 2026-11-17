import { InvariantUpdatedEventHandler } from "../../../../../../src/application/context/invariants/update/InvariantUpdatedEventHandler.js";
import { IInvariantUpdatedProjector } from "../../../../../../src/application/context/invariants/update/IInvariantUpdatedProjector.js";
import { InvariantUpdatedEvent } from "../../../../../../src/domain/invariants/update/InvariantUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("InvariantUpdatedEventHandler", () => {
  let projector: jest.Mocked<IInvariantUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: InvariantUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyInvariantUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new InvariantUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: InvariantUpdatedEvent = {
      type: "InvariantUpdatedEvent",
      aggregateId: "inv_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { title: "Updated invariant" },
    };

    await handler.handle(event);

    expect(projector.applyInvariantUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "invariant",
      "inv_123",
      "invariant was updated"
    );
  });
});
