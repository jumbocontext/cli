import { ComponentUpdatedEventHandler } from "../../../../../../src/application/context/components/update/ComponentUpdatedEventHandler.js";
import { IComponentUpdatedProjector } from "../../../../../../src/application/context/components/update/IComponentUpdatedProjector.js";
import { ComponentUpdatedEvent } from "../../../../../../src/domain/components/update/ComponentUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ComponentUpdatedEventHandler", () => {
  let projector: jest.Mocked<IComponentUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ComponentUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ComponentUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: ComponentUpdatedEvent = {
      type: "ComponentUpdatedEvent",
      aggregateId: "comp_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { description: "Updated description" },
    };

    await handler.handle(event);

    expect(projector.applyComponentUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "component was updated"
    );
  });
});
