import { describe, it, expect, jest } from "@jest/globals";
import { LocalRemoveDecisionGateway } from "../../../../../src/application/context/decisions/remove/LocalRemoveDecisionGateway.js";
import type { RemoveDecisionCommandHandler } from "../../../../../src/application/context/decisions/remove/RemoveDecisionCommandHandler.js";
import { DecisionStatus } from "../../../../../src/domain/decisions/Constants.js";

describe("LocalRemoveDecisionGateway", () => {
  it("delegates to the prerequisite handler and maps its result to removed status", async () => {
    const handler: jest.Mocked<Pick<RemoveDecisionCommandHandler, "execute">> = { execute: jest.fn() };
    handler.execute.mockResolvedValue({ decisionId: "returned-id" });
    const gateway = new LocalRemoveDecisionGateway(handler as unknown as RemoveDecisionCommandHandler);
    expect(await gateway.removeDecision({ decisionId: "requested-id" })).toEqual({
      decisionId: "returned-id", status: DecisionStatus.REMOVED,
    });
    expect(handler.execute).toHaveBeenCalledWith({ decisionId: "requested-id" });
    expect(handler.execute).toHaveBeenCalledTimes(1);
  });

  it("propagates command handler failures unchanged", async () => {
    const handler: jest.Mocked<Pick<RemoveDecisionCommandHandler, "execute">> = { execute: jest.fn() };
    const error = new Error("Removal rejected");
    handler.execute.mockRejectedValue(error);
    const gateway = new LocalRemoveDecisionGateway(handler as unknown as RemoveDecisionCommandHandler);
    await expect(gateway.removeDecision({ decisionId: "missing" })).rejects.toBe(error);
  });
});
