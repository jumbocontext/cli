import { GoalRemovedEventHandler } from "../../../../../../src/application/context/goals/remove/GoalRemovedEventHandler.js";
import { IGoalRemovedProjector } from "../../../../../../src/application/context/goals/remove/IGoalRemovedProjector.js";
import { GoalRemovedEvent } from "../../../../../../src/domain/goals/remove/GoalRemovedEvent.js";
import { RelationPruningCascade } from "../../../../../../src/application/context/relations/prune/RelationPruningCascade.js";
import { jest } from "@jest/globals";

describe("GoalRemovedEventHandler", () => {
  let projector: jest.Mocked<IGoalRemovedProjector>;
  let relationPruningCascade: jest.Mocked<RelationPruningCascade>;
  let handler: GoalRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationPruningCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationPruningCascade>;
    handler = new GoalRemovedEventHandler(projector, relationPruningCascade);
  });

  it("projects removal and cascades relation pruning", async () => {
    const event: GoalRemovedEvent = {
      type: "GoalRemovedEvent",
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { removedAt: "2026-03-01T00:00:00.000Z" },
    };

    await handler.handle(event);

    expect(relationPruningCascade.execute).toHaveBeenCalledWith(
      "goal",
      "goal_123",
      "Automatically pruned because goal goal_123 was removed"
    );
    expect(projector.applyGoalRemoved).toHaveBeenCalledWith(event);
  });
});
