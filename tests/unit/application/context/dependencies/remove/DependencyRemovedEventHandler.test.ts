import { DependencyRemovedEventHandler } from "../../../../../../src/application/context/dependencies/remove/DependencyRemovedEventHandler.js";
import { IDependencyRemovedProjector } from "../../../../../../src/application/context/dependencies/remove/IDependencyRemovedProjector.js";
import { DependencyRemovedEvent } from "../../../../../../src/domain/dependencies/remove/DependencyRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("DependencyRemovedEventHandler", () => {
  let projector: jest.Mocked<IDependencyRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: DependencyRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyDependencyRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new DependencyRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: DependencyRemovedEvent = {
      type: "DependencyRemovedEvent",
      aggregateId: "dep_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { reason: "No longer needed" },
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "dependency",
      "dep_123",
      "dependency was removed"
    );
    expect(projector.applyDependencyRemoved).toHaveBeenCalledWith(event);
  });
});
