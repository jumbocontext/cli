import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalPauseWorkGateway } from "../../../../../../src/application/context/work/pause/LocalPauseWorkGateway";
import { PauseWorkCommandHandler } from "../../../../../../src/application/context/work/pause/PauseWorkCommandHandler";

describe("LocalPauseWorkGateway", () => {
  let gateway: LocalPauseWorkGateway;
  let mockCommandHandler: jest.Mocked<Pick<PauseWorkCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    };

    gateway = new LocalPauseWorkGateway(
      mockCommandHandler as unknown as PauseWorkCommandHandler
    );
  });

  it("should delegate to command handler and return response", async () => {
    mockCommandHandler.execute.mockResolvedValue({
      goalId: "goal_123",
      objective: "Implement feature",
    });

    const response = await gateway.pauseWork({});

    expect(response.goalId).toBe("goal_123");
    expect(response.objective).toBe("Implement feature");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({});
  });

  it("should propagate errors from command handler", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("No active goal found for current worker")
    );

    await expect(gateway.pauseWork({})).rejects.toThrow(
      "No active goal found for current worker"
    );
  });
});
