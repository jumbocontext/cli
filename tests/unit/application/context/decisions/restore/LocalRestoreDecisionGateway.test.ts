import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRestoreDecisionGateway } from "../../../../../../src/application/context/decisions/restore/LocalRestoreDecisionGateway.js";
import { RestoreDecisionCommandHandler } from "../../../../../../src/application/context/decisions/restore/RestoreDecisionCommandHandler.js";

describe("LocalRestoreDecisionGateway", () => {
  let gateway: LocalRestoreDecisionGateway;
  let commandHandler: jest.Mocked<Pick<RestoreDecisionCommandHandler, "execute">>;

  beforeEach(() => {
    commandHandler = {
      execute: jest.fn(),
    } as jest.Mocked<Pick<RestoreDecisionCommandHandler, "execute">>;

    gateway = new LocalRestoreDecisionGateway(commandHandler as unknown as RestoreDecisionCommandHandler);
  });

  it("delegates restore command and maps response", async () => {
    commandHandler.execute.mockResolvedValue({ decisionId: "dec_123" });

    const response = await gateway.restoreDecision({
      decisionId: "dec_123",
      reason: "Still valid",
    });

    expect(commandHandler.execute).toHaveBeenCalledWith({
      decisionId: "dec_123",
      reason: "Still valid",
    });
    expect(response).toEqual({ decisionId: "dec_123" });
  });
});
