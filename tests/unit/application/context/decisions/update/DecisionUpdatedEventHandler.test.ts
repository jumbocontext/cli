import { DecisionUpdatedEventHandler } from "../../../../../../src/application/context/decisions/update/DecisionUpdatedEventHandler.js";
import { IDecisionUpdatedProjector } from "../../../../../../src/application/context/decisions/update/IDecisionUpdatedProjector.js";
import { DecisionUpdatedEvent } from "../../../../../../src/domain/decisions/update/DecisionUpdatedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("DecisionUpdatedEventHandler", () => {
  let projector: jest.Mocked<IDecisionUpdatedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: DecisionUpdatedEventHandler;

  beforeEach(() => {
    projector = {
      applyDecisionUpdated: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new DecisionUpdatedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("projects update and registers relation maintenance goal", async () => {
    const event: DecisionUpdatedEvent = {
      type: "DecisionUpdatedEvent",
      aggregateId: "dec_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { rationale: "Updated rationale" },
    };

    await handler.handle(event);

    expect(projector.applyDecisionUpdated).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "decision was updated"
    );
  });
});
