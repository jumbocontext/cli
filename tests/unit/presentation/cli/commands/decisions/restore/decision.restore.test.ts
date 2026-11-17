import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { decisionRestore } from "../../../../../../../src/presentation/cli/commands/decisions/restore/decision.restore.js";
import { RestoreDecisionController } from "../../../../../../../src/application/context/decisions/restore/RestoreDecisionController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { DecisionRestoreDependencies } from "../../../../../../../src/presentation/cli/commands/decisions/restore/decision.restore.js";

describe("decision.restore command", () => {
  let mockContainer: Partial<DecisionRestoreDependencies>;
  let mockController: jest.Mocked<Pick<RestoreDecisionController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<RestoreDecisionController, "handle">>;

    mockContainer = {
      restoreDecisionController: mockController as unknown as RestoreDecisionController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("restores a decision via the controller", async () => {
    mockController.handle.mockResolvedValue({ decisionId: "dec_123" });

    await decisionRestore(
      { id: "dec_123", reason: "Still valid" },
      mockContainer as DecisionRestoreDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      decisionId: "dec_123",
      reason: "Still valid",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("displays error and exits on failure", async () => {
    mockController.handle.mockRejectedValue(new Error("Decision is already active"));

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await decisionRestore(
      { id: "dec_123", reason: "Still valid" },
      mockContainer as DecisionRestoreDependencies
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
