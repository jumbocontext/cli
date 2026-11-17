import { LocalCloseGoalGateway } from "../../../../../../src/application/context/goals/close/LocalCloseGoalGateway";
import { CloseGoalCommandHandler } from "../../../../../../src/application/context/goals/close/CloseGoalCommandHandler";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";
import { IGoalCloseReader } from "../../../../../../src/application/context/goals/close/IGoalCloseReader";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { jest } from "@jest/globals";

describe("LocalCloseGoalGateway", () => {
  let gateway: LocalCloseGoalGateway;
  let mockCommandHandler: jest.Mocked<CloseGoalCommandHandler>;
  let mockGoalReader: jest.Mocked<IGoalCloseReader>;
  let mockClaimPolicy: jest.Mocked<GoalClaimPolicy>;
  let mockWorkerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CloseGoalCommandHandler>;

    mockGoalReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGoalCloseReader>;

    mockClaimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as jest.Mocked<GoalClaimPolicy>;

    mockWorkerIdentityReader = {
      workerId: testWorkerId,
    };

    gateway = new LocalCloseGoalGateway(
      mockCommandHandler,
      mockGoalReader,
      mockClaimPolicy,
      mockWorkerIdentityReader
    );
  });

  it("closes a goal successfully and returns goalId, objective, status", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Close the goal",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DONE,
      version: 9,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockCommandHandler.execute.mockResolvedValue({} as unknown as ContextualGoalView);
    mockGoalReader.findById.mockResolvedValue(mockView);

    const response = await gateway.closeGoal({ goalId: "goal_456" });

    expect(response.goalId).toBe("goal_456");
    expect(response.objective).toBe("Close the goal");
    expect(response.status).toBe(GoalStatus.DONE);
    expect(response.nextGoal).toBeUndefined();
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
  });

  it("includes next goal in response when nextGoalId exists", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Close the goal",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DONE,
      version: 9,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
      nextGoalId: "goal_789",
    };
    const nextGoalView: GoalView = {
      goalId: "goal_789",
      objective: "Next goal objective",
      successCriteria: ["Next criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockCommandHandler.execute.mockResolvedValue({} as unknown as ContextualGoalView);
    mockGoalReader.findById
      .mockResolvedValueOnce(mockView)
      .mockResolvedValueOnce(nextGoalView);

    const response = await gateway.closeGoal({ goalId: "goal_456" });

    expect(response.nextGoal).toBeDefined();
    expect(response.nextGoal?.goalId).toBe("goal_789");
    expect(response.nextGoal?.objective).toBe("Next goal objective");
    expect(response.nextGoal?.status).toBe(GoalStatus.TODO);
  });

  it("rejects close when goal is claimed by another worker", async () => {
    (mockClaimPolicy.canClaim as jest.Mock).mockReturnValue({
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim: {
        goalId: "goal_123",
        claimedBy: createWorkerId("other-worker-id"),
        claimedAt: "2025-01-15T09:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z",
      },
    });

    await expect(
      gateway.closeGoal({ goalId: "goal_123" })
    ).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    expect(mockGoalReader.findById).not.toHaveBeenCalled();
    expect(mockCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("propagates errors from command handler", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Cannot close goal in defined status. Goal must be in codifying status.")
    );

    await expect(
      gateway.closeGoal({ goalId: "goal_123" })
    ).rejects.toThrow("Cannot close goal in defined status. Goal must be in codifying status.");

    expect(mockGoalReader.findById).not.toHaveBeenCalled();
  });
});
