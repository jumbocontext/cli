import { DecisionRestoredEventHandler } from "../../../../../../src/application/context/decisions/restore/DecisionRestoredEventHandler.js";
import { IDecisionRestoredProjector } from "../../../../../../src/application/context/decisions/restore/IDecisionRestoredProjector.js";
import { DecisionRestoredEvent } from "../../../../../../src/domain/decisions/restore/DecisionRestoredEvent.js";
import { DecisionEventType } from "../../../../../../src/domain/decisions/Constants.js";
import { RelationReactivationCascade } from "../../../../../../src/application/context/relations/reactivate/RelationReactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("DecisionRestoredEventHandler", () => {
  let projector: jest.Mocked<IDecisionRestoredProjector>;
  let relationReactivationCascade: jest.Mocked<RelationReactivationCascade>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: DecisionRestoredEventHandler;

  beforeEach(() => {
    projector = {
      applyDecisionRestored: jest.fn().mockResolvedValue(undefined),
    };
    relationReactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationReactivationCascade>;
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new DecisionRestoredEventHandler(projector, relationReactivationCascade, relationMaintenanceGoalRegistrar);
  });

  it("projects restoration and cascades relation reactivation", async () => {
    const event: DecisionRestoredEvent = {
      type: DecisionEventType.RESTORED,
      aggregateId: "dec_123",
      version: 3,
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: {
        reason: "Decision still applies",
        restoredAt: "2026-03-02T00:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyDecisionRestored).toHaveBeenCalledWith(event);
    expect(relationReactivationCascade.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "Automatically reactivated because decision dec_123 was restored: Decision still applies"
    );
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "decision was restored: Decision still applies"
    );
  });
});
