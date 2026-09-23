import { jest } from "@jest/globals";
import { RefineGoalCommandHandler } from "../../../../../src/application/context/goals/refine/RefineGoalCommandHandler";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { GoalContextQueryHandler } from "../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { ISettingsReader } from "../../../../../src/application/settings/ISettingsReader";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("RefineGoalCommandHandler postponed safeguard", () => {
  it("rejects a postponed goal when the handler is invoked directly", async () => {
    const eventWriter = { append: jest.fn().mockResolvedValue({ nextSeq: 3 }) };
    const eventReader = {
      readStream: jest.fn().mockResolvedValue([
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2026-09-11T09:00:00.000Z",
          payload: {
            title: "Later work",
            objective: "Keep this visible",
            successCriteria: ["Excluded from refinement"],
            scopeIn: [],
            scopeOut: [],
            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.POSTPONED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2026-09-11T10:00:00.000Z",
          payload: { status: GoalStatus.POSTPONED },
        },
      ]),
    };
    const goalReader = { findById: jest.fn().mockResolvedValue({ goalId: "goal_123", status: GoalStatus.POSTPONED }) };
    const eventBus = { subscribe: jest.fn(), publish: jest.fn().mockResolvedValue(undefined) };
    const claimPolicy = {
      prepareEntryClaim: jest.fn().mockReturnValue({
        allowed: true,
        claim: {
          goalId: "goal_123",
          claimedBy: "worker_test",
          claimedAt: "2026-09-11T10:30:00.000Z",
          claimExpiresAt: "2026-09-11T11:30:00.000Z",
        },
      }),
      storeClaim: jest.fn(),
    };
    const settingsReader = {
      read: jest.fn().mockResolvedValue({ claims: { claimDurationMinutes: 60 } }),
    };
    const goalContextQueryHandler = { execute: jest.fn() };
    const handler = new RefineGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy as unknown as GoalClaimPolicy,
      { workerId: "worker_test" } as IWorkerIdentityReader,
      settingsReader as unknown as ISettingsReader,
      goalContextQueryHandler as unknown as GoalContextQueryHandler
    );

    await expect(handler.execute({ goalId: "goal_123" })).rejects.toThrow(
      "Cannot refine goal in postponed status. Goal must be in defined status."
    );
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(claimPolicy.storeClaim).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
