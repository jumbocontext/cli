import { describe, it, expect, jest } from "@jest/globals";
import { RemoveDecisionController } from "../../../../../src/application/context/decisions/remove/RemoveDecisionController.js";
import type { IRemoveDecisionGateway } from "../../../../../src/application/context/decisions/remove/IRemoveDecisionGateway.js";
import { DecisionStatus } from "../../../../../src/domain/decisions/Constants.js";

describe("RemoveDecisionController", () => {
  it("delegates the request and returns the gateway response", async () => {
    const gateway: jest.Mocked<IRemoveDecisionGateway> = { removeDecision: jest.fn() };
    const request = { decisionId: "dec_123" };
    const response = { decisionId: request.decisionId, status: DecisionStatus.REMOVED };
    gateway.removeDecision.mockResolvedValue(response);
    expect(await new RemoveDecisionController(gateway).handle(request)).toBe(response);
    expect(gateway.removeDecision).toHaveBeenCalledWith(request);
    expect(gateway.removeDecision).toHaveBeenCalledTimes(1);
  });

  it("propagates gateway failures unchanged", async () => {
    const gateway: jest.Mocked<IRemoveDecisionGateway> = { removeDecision: jest.fn() };
    const error = new Error("Removal rejected");
    gateway.removeDecision.mockRejectedValue(error);
    await expect(new RemoveDecisionController(gateway).handle({ decisionId: "missing" })).rejects.toBe(error);
  });
});
