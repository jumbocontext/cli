import { DecisionSupersededEventHandler } from "../../../../../../src/application/context/decisions/supersede/DecisionSupersededEventHandler.js";
import { IDecisionSupersededProjector } from "../../../../../../src/application/context/decisions/supersede/IDecisionSupersededProjector.js";
import { DecisionSupersededEvent } from "../../../../../../src/domain/decisions/supersede/DecisionSupersededEvent.js";
import { DecisionEventType } from "../../../../../../src/domain/decisions/Constants.js";
import { RelationDeactivationCascade } from "../../../../../../src/application/context/relations/deactivate/RelationDeactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("DecisionSupersededEventHandler", () => {
  let projector: jest.Mocked<IDecisionSupersededProjector>;
  let relationDeactivationCascade: jest.Mocked<RelationDeactivationCascade>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: DecisionSupersededEventHandler;

  beforeEach(() => {
    projector = {
      applyDecisionSuperseded: jest.fn().mockResolvedValue(undefined),
    };
    relationDeactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationDeactivationCascade>;
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new DecisionSupersededEventHandler(projector, relationDeactivationCascade, relationMaintenanceGoalRegistrar);
  });

  it("projects supersession and cascades relation deactivation", async () => {
    const event: DecisionSupersededEvent = {
      type: DecisionEventType.SUPERSEDED,
      aggregateId: "dec_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {
        supersededBy: "dec_456",
      },
    };

    await handler.handle(event);

    expect(projector.applyDecisionSuperseded).toHaveBeenCalledWith(event);
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "decision was superseded by decision dec_456"
    );
    expect(relationDeactivationCascade.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "Automatically deactivated because decision dec_123 was superseded by decision dec_456"
    );
  });
});
