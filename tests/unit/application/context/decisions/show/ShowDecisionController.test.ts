import { describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { IShowDecisionGateway } from "../../../../../../src/application/context/decisions/show/IShowDecisionGateway.js";
import { ShowDecisionController } from "../../../../../../src/application/context/decisions/show/ShowDecisionController.js";

describe("ShowDecisionController", () => {
  it("delegates the typed request and returns the gateway response", async () => {
    const decision: DecisionView = {
      decisionId: "dec_123",
      title: "Use event sourcing",
      context: "Auditability is required.",
      rationale: null,
      alternatives: [],
      consequences: null,
      status: "active",
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
      version: 1,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    };
    const gateway: jest.Mocked<IShowDecisionGateway> = {
      showDecision: jest.fn().mockResolvedValue({ decision }),
    };
    const controller = new ShowDecisionController(gateway);

    await expect(controller.handle({ decisionId: "dec_123" })).resolves.toEqual({ decision });
    expect(gateway.showDecision).toHaveBeenCalledWith({ decisionId: "dec_123" });
  });
});
