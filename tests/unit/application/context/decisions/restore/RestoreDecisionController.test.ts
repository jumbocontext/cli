import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RestoreDecisionController } from "../../../../../../src/application/context/decisions/restore/RestoreDecisionController.js";
import { IRestoreDecisionGateway } from "../../../../../../src/application/context/decisions/restore/IRestoreDecisionGateway.js";

describe("RestoreDecisionController", () => {
  let controller: RestoreDecisionController;
  let mockGateway: jest.Mocked<IRestoreDecisionGateway>;

  beforeEach(() => {
    mockGateway = {
      restoreDecision: jest.fn(),
    } as jest.Mocked<IRestoreDecisionGateway>;

    controller = new RestoreDecisionController(mockGateway);
  });

  it("delegates to gateway and returns response", async () => {
    const request = { decisionId: "dec_123", reason: "Still valid" };
    const expectedResponse = { decisionId: "dec_123" };

    mockGateway.restoreDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.restoreDecision).toHaveBeenCalledWith(request);
  });
});
