import { InvariantRemovedEventHandler } from "../../../../../../src/application/context/invariants/remove/InvariantRemovedEventHandler.js";
import { IInvariantRemovedProjector } from "../../../../../../src/application/context/invariants/remove/IInvariantRemovedProjector.js";
import { InvariantRemovedEvent } from "../../../../../../src/domain/invariants/remove/InvariantRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("InvariantRemovedEventHandler", () => {
  let projector: jest.Mocked<IInvariantRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: InvariantRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyInvariantRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new InvariantRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: InvariantRemovedEvent = {
      type: "InvariantRemovedEvent",
      aggregateId: "inv_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { removedAt: "2026-03-01T00:00:00.000Z" },
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "invariant",
      "inv_123",
      "invariant was removed"
    );
    expect(projector.applyInvariantRemoved).toHaveBeenCalledWith(event);
  });
});
