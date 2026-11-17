import { DependencyUpdatedEventHandler } from "../../../../../../src/application/context/dependencies/update/DependencyUpdatedEventHandler.js";
import { IDependencyUpdatedProjector } from "../../../../../../src/application/context/dependencies/update/IDependencyUpdatedProjector.js";
import { DependencyUpdatedEvent } from "../../../../../../src/domain/dependencies/update/DependencyUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("DependencyUpdatedEventHandler", () => {
  let projector: jest.Mocked<IDependencyUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: DependencyUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyDependencyUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new DependencyUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: DependencyUpdatedEvent = {
      type: "DependencyUpdatedEvent",
      aggregateId: "dep_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { endpoint: "https://api.example.com" },
    };

    await handler.handle(event);

    expect(projector.applyDependencyUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "dependency",
      "dep_123",
      "dependency was updated"
    );
  });
});
