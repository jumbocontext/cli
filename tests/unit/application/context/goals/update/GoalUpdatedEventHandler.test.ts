import { GoalUpdatedEventHandler } from "../../../../../../src/application/context/goals/update/GoalUpdatedEventHandler.js";
import { IGoalUpdatedProjector } from "../../../../../../src/application/context/goals/update/IGoalUpdatedProjector.js";
import { GoalUpdatedEvent } from "../../../../../../src/domain/goals/update/GoalUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("GoalUpdatedEventHandler", () => {
  let projector: jest.Mocked<IGoalUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: GoalUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new GoalUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: GoalUpdatedEvent = {
      type: "GoalUpdatedEvent",
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { objective: "Updated objective" },
    };

    await handler.handle(event);

    expect(projector.applyGoalUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "goal",
      "goal_123",
      "goal was updated"
    );
  });
});
