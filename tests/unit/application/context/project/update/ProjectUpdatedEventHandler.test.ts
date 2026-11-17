import { ProjectUpdatedEventHandler } from "../../../../../../src/application/context/project/update/ProjectUpdatedEventHandler.js";
import { IProjectUpdatedProjector } from "../../../../../../src/application/context/project/update/IProjectUpdatedProjector.js";
import { ProjectUpdatedEvent } from "../../../../../../src/domain/project/update/ProjectUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ProjectUpdatedEventHandler", () => {
  let projector: jest.Mocked<IProjectUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ProjectUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyProjectUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ProjectUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: ProjectUpdatedEvent = {
      type: "ProjectUpdatedEvent",
      aggregateId: "proj_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { purpose: "Updated purpose" },
    };

    await handler.handle(event);

    expect(projector.applyProjectUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "project",
      "proj_123",
      "project was updated"
    );
  });
});
