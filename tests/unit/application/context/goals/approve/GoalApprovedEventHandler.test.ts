import { GoalApprovedEventHandler } from "../../../../../../src/application/context/goals/approve/GoalApprovedEventHandler";
import { IGoalApprovedProjector } from "../../../../../../src/application/context/goals/approve/IGoalApprovedProjector";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalApprovedEvent } from "../../../../../../src/domain/goals/approve/GoalApprovedEvent";
import { jest } from "@jest/globals";

describe("GoalApprovedEventHandler", () => {
  let projector: jest.Mocked<IGoalApprovedProjector>;
  let handler: GoalApprovedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalApproved: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GoalApprovedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: GoalApprovedEvent = {
      type: GoalEventType.APPROVED,
      aggregateId: "goal_123",
      version: 7,
      timestamp: "2025-01-15T10:00:00.000Z",
      payload: {
        status: GoalStatus.QUALIFIED,
        approvedAt: "2025-01-15T10:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalApproved).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalApproved).toHaveBeenCalledWith(event);
  });
});
