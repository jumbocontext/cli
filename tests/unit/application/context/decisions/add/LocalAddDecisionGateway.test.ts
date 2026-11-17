import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddDecisionGateway } from "../../../../../../src/application/context/decisions/add/LocalAddDecisionGateway.js";
import { AddDecisionCommandHandler } from "../../../../../../src/application/context/decisions/add/AddDecisionCommandHandler.js";

describe("LocalAddDecisionGateway", () => {
  let gateway: LocalAddDecisionGateway;
  let mockCommandHandler: jest.Mocked<AddDecisionCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddDecisionCommandHandler>;

    gateway = new LocalAddDecisionGateway(mockCommandHandler);
  });

  it("should execute command and return decision id", async () => {
    const decisionId = "dec_123";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.addDecision({
      title: "Use JWT tokens",
      context: "Need stateless auth",
      rationale: "Scalable across services",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Requires token refresh strategy",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Use JWT tokens",
      context: "Need stateless auth",
      rationale: "Scalable across services",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Requires token refresh strategy",
    });
  });

  it("should handle request with only required fields", async () => {
    const decisionId = "dec_456";

    mockCommandHandler.execute.mockResolvedValue({ decisionId });

    const response = await gateway.addDecision({
      title: "Use PostgreSQL",
      context: "Need relational database",
    });

    expect(response.decisionId).toBe(decisionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Use PostgreSQL",
      context: "Need relational database",
      rationale: undefined,
      alternatives: undefined,
      consequences: undefined,
    });
  });
});
