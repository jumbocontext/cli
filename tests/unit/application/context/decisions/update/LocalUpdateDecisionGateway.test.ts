import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateDecisionGateway } from "../../../../../../src/application/context/decisions/update/LocalUpdateDecisionGateway.js";
import { UpdateDecisionCommandHandler } from "../../../../../../src/application/context/decisions/update/UpdateDecisionCommandHandler.js";

describe("LocalUpdateDecisionGateway", () => {
  let gateway: LocalUpdateDecisionGateway;
  let mockCommandHandler: jest.Mocked<UpdateDecisionCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateDecisionCommandHandler>;

    gateway = new LocalUpdateDecisionGateway(mockCommandHandler);
  });

  it("should execute command and return decision id", async () => {
    const decisionId = "dec_123";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.updateDecision({
      decisionId: "dec_123",
      title: "Use JWT with refresh tokens",
      context: "Updated context",
      rationale: "Updated rationale",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Updated consequences",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      decisionId: "dec_123",
      title: "Use JWT with refresh tokens",
      context: "Updated context",
      rationale: "Updated rationale",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Updated consequences",
    });
  });

  it("should handle request with only decision id and one field", async () => {
    const decisionId = "dec_456";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.updateDecision({
      decisionId: "dec_456",
      title: "Updated title",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      decisionId: "dec_456",
      title: "Updated title",
      context: undefined,
      rationale: undefined,
      alternatives: undefined,
      consequences: undefined,
    });
  });
});
