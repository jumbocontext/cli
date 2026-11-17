import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalSupersedeDecisionGateway } from "../../../../../../src/application/context/decisions/supersede/LocalSupersedeDecisionGateway.js";
import { SupersedeDecisionCommandHandler } from "../../../../../../src/application/context/decisions/supersede/SupersedeDecisionCommandHandler.js";

describe("LocalSupersedeDecisionGateway", () => {
  let gateway: LocalSupersedeDecisionGateway;
  let mockCommandHandler: jest.Mocked<SupersedeDecisionCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SupersedeDecisionCommandHandler>;

    gateway = new LocalSupersedeDecisionGateway(mockCommandHandler);
  });

  it("should execute command and return decision id", async () => {
    const decisionId = "dec_123";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.supersedeDecision({
      decisionId: "dec_123",
      supersededBy: "dec_456",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      decisionId: "dec_123",
      supersededBy: "dec_456",
    });
  });
});
