import { ArchitectureUpdatedEventHandler } from "../../../../../../src/application/context/architecture/update/ArchitectureUpdatedEventHandler.js";
import { IArchitectureUpdatedProjector } from "../../../../../../src/application/context/architecture/update/IArchitectureUpdatedProjector.js";
import { ArchitectureUpdatedEvent } from "../../../../../../src/domain/architecture/update/ArchitectureUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ArchitectureUpdatedEventHandler", () => {
  let projector: jest.Mocked<IArchitectureUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ArchitectureUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyArchitectureUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ArchitectureUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: ArchitectureUpdatedEvent = {
      type: "ArchitectureUpdatedEvent",
      aggregateId: "arch_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { description: "Updated architecture" },
    };

    await handler.handle(event);

    expect(projector.applyArchitectureUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "architecture",
      "arch_123",
      "architecture was updated"
    );
  });
});
