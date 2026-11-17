import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalReverseDecisionGateway } from "../../../../../../src/application/context/decisions/reverse/LocalReverseDecisionGateway.js";
import { ReverseDecisionCommandHandler } from "../../../../../../src/application/context/decisions/reverse/ReverseDecisionCommandHandler.js";

describe("LocalReverseDecisionGateway", () => {
  let gateway: LocalReverseDecisionGateway;
  let mockCommandHandler: jest.Mocked<ReverseDecisionCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ReverseDecisionCommandHandler>;

    gateway = new LocalReverseDecisionGateway(mockCommandHandler);
  });

  it("should execute command and return decision id", async () => {
    const decisionId = "dec_123";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.reverseDecision({
      decisionId: "dec_123",
      reason: "Requirements changed",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      decisionId: "dec_123",
      reason: "Requirements changed",
    });
  });
});
