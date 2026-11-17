/**
 * Tests for GoalRejectedEventHandler (projection event handler)
 */

import { GoalRejectedEventHandler } from "../../../../../../src/application/context/goals/reject/GoalRejectedEventHandler";
import { IGoalRejectedProjector } from "../../../../../../src/application/context/goals/reject/IGoalRejectedProjector";
import { GoalRejectedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalRejectedEventHandler", () => {
  let projector: IGoalRejectedProjector;
  let handler: GoalRejectedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalRejected: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalRejectedEventHandler(projector);
  });

  it("should apply GoalRejectedEvent to projector", async () => {
    const event: GoalRejectedEvent = {
      type: GoalEventType.REJECTED,
      aggregateId: "goal_123",
      version: 4,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REJECTED,
        rejectedAt: new Date().toISOString(),
        reviewIssues: "Missing error handling",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalRejected).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalRejected).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    const event: GoalRejectedEvent = {
      type: GoalEventType.REJECTED,
      aggregateId: "goal_123",
      version: 4,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REJECTED,
        rejectedAt: new Date().toISOString(),
        reviewIssues: "Missing error handling",
      },
    };

    (projector.applyGoalRejected as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
