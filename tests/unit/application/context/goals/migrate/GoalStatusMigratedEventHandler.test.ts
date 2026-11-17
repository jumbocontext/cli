import { GoalStatusMigratedEventHandler } from "../../../../../../src/application/context/goals/migrate/GoalStatusMigratedEventHandler";
import { IGoalStatusMigratedProjector } from "../../../../../../src/application/context/goals/migrate/IGoalStatusMigratedProjector";
import { GoalEventType } from "../../../../../../src/domain/goals/Constants";
import { GoalStatusMigratedEvent } from "../../../../../../src/domain/goals/migrate/GoalStatusMigratedEvent";
import { GoalStatusType } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalStatusMigratedEventHandler", () => {
  let projector: jest.Mocked<IGoalStatusMigratedProjector>;
  let handler: GoalStatusMigratedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalStatusMigrated: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GoalStatusMigratedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: GoalStatusMigratedEvent = {
      type: GoalEventType.STATUS_MIGRATED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: "2025-01-15T10:00:00.000Z",
      payload: {
        fromStatus: "to-do",
        toStatus: "defined" as GoalStatusType,
        status: "defined" as GoalStatusType,
        migratedAt: "2025-01-15T10:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalStatusMigrated).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalStatusMigrated).toHaveBeenCalledWith(event);
  });
});
