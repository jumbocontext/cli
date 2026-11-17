import { DecisionReversedEventHandler } from "../../../../../../src/application/context/decisions/reverse/DecisionReversedEventHandler.js";
import { IDecisionReversedProjector } from "../../../../../../src/application/context/decisions/reverse/IDecisionReversedProjector.js";
import { DecisionReversedEvent } from "../../../../../../src/domain/decisions/reverse/DecisionReversedEvent.js";
import { DecisionEventType } from "../../../../../../src/domain/decisions/Constants.js";
import { RelationDeactivationCascade } from "../../../../../../src/application/context/relations/deactivate/RelationDeactivationCascade.js";
import { jest } from "@jest/globals";

describe("DecisionReversedEventHandler", () => {
  let projector: jest.Mocked<IDecisionReversedProjector>;
  let relationDeactivationCascade: jest.Mocked<RelationDeactivationCascade>;
  let handler: DecisionReversedEventHandler;

  beforeEach(() => {
    projector = {
      applyDecisionReversed: jest.fn().mockResolvedValue(undefined),
    };
    relationDeactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationDeactivationCascade>;
    handler = new DecisionReversedEventHandler(projector, relationDeactivationCascade);
  });

  it("projects reversal and cascades relation deactivation", async () => {
    const event: DecisionReversedEvent = {
      type: DecisionEventType.REVERSED,
      aggregateId: "dec_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {
        reason: "No longer valid",
        reversedAt: "2026-03-01T00:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyDecisionReversed).toHaveBeenCalledWith(event);
    expect(relationDeactivationCascade.execute).toHaveBeenCalledWith(
      "decision",
      "dec_123",
      "Automatically deactivated because decision dec_123 was reversed: No longer valid"
    );
  });
});
