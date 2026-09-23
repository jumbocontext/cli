import { describe, expect, it, jest } from "@jest/globals";
import { GoalBacklogPreviewQueryHandler } from "../../../../../src/application/context/goals/query/GoalBacklogPreviewQueryHandler.js";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { GoalStatus, GoalStatusType } from "../../../../../src/domain/goals/Constants.js";

function goal(
  goalId: string,
  status: GoalStatusType,
  createdAt: string,
  title = goalId
): GoalView {
  return {
    goalId,
    title,
    objective: `Objective ${goalId}`,
    successCriteria: ["Done"],
    scopeIn: [],
    scopeOut: [],
    status,
    version: 1,
    createdAt,
    updatedAt: createdAt,
    progress: [],
  };
}

describe("GoalBacklogPreviewQueryHandler", () => {
  it("prioritizes preview goals by status and then oldest createdAt", async () => {
    const reader: jest.Mocked<IGoalStatusReader> = {
      findAll: jest.fn().mockResolvedValue([
        goal("doing", GoalStatus.DOING, "2026-01-01T00:00:00.000Z"),
        goal("defined", GoalStatus.TODO, "2026-01-01T00:00:00.000Z"),
        goal("blocked-new", GoalStatus.BLOCKED, "2026-01-03T00:00:00.000Z"),
        goal("blocked-old", GoalStatus.BLOCKED, "2026-01-02T00:00:00.000Z"),
        goal("rejected", GoalStatus.REJECTED, "2026-01-01T00:00:00.000Z"),
        goal("approved", GoalStatus.QUALIFIED, "2026-01-01T00:00:00.000Z"),
        goal("refined", GoalStatus.REFINED, "2026-01-01T00:00:00.000Z"),
        goal("in-review", GoalStatus.INREVIEW, "2026-01-01T00:00:00.000Z"),
        goal("in-refinement", GoalStatus.IN_REFINEMENT, "2026-01-01T00:00:00.000Z"),
        goal("codifying", GoalStatus.CODIFYING, "2026-01-01T00:00:00.000Z"),
      ]),
      findByStatus: jest.fn(),
    };
    const handler = new GoalBacklogPreviewQueryHandler(reader);

    const result = await handler.execute(20);

    expect(result.map((item) => item.goalId)).toEqual([
      "blocked-old",
      "blocked-new",
      "rejected",
      "approved",
      "refined",
      "defined",
      "doing",
      "in-review",
      "in-refinement",
      "codifying",
    ]);
  });

  it("limits preview size and returns only DTO fields", async () => {
    const reader: jest.Mocked<IGoalStatusReader> = {
      findAll: jest.fn().mockResolvedValue([
        goal("blocked", GoalStatus.BLOCKED, "2026-01-01T00:00:00.000Z", "Blocked goal"),
        goal("rejected", GoalStatus.REJECTED, "2026-01-01T00:00:00.000Z", "Rejected goal"),
      ]),
      findByStatus: jest.fn(),
    };
    const handler = new GoalBacklogPreviewQueryHandler(reader);

    const result = await handler.execute(1);

    expect(result).toEqual([
      {
        goalId: "blocked",
        title: "Blocked goal",
        status: GoalStatus.BLOCKED,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(Object.keys(result[0]).sort()).toEqual([
      "createdAt",
      "goalId",
      "status",
      "title",
    ]);
  });

  it("excludes statuses outside the session-start preview policy", async () => {
    const reader: jest.Mocked<IGoalStatusReader> = {
      findAll: jest.fn().mockResolvedValue([
        goal("paused", GoalStatus.PAUSED, "2026-01-01T00:00:00.000Z"),
        goal("postponed", GoalStatus.POSTPONED, "2026-01-01T00:00:00.000Z"),
        goal("submitted", GoalStatus.SUBMITTED, "2026-01-01T00:00:00.000Z"),
        goal("unblocked", GoalStatus.UNBLOCKED, "2026-01-01T00:00:00.000Z"),
        goal("done", GoalStatus.DONE, "2026-01-01T00:00:00.000Z"),
        goal("refined", GoalStatus.REFINED, "2026-01-01T00:00:00.000Z"),
      ]),
      findByStatus: jest.fn(),
    };
    const handler = new GoalBacklogPreviewQueryHandler(reader);

    const result = await handler.execute(10);

    expect(result.map((item) => item.goalId)).toEqual(["refined"]);
  });
});
