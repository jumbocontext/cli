import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ReverseDecisionController } from "../../../../../../src/application/context/decisions/reverse/ReverseDecisionController.js";
import { IReverseDecisionGateway } from "../../../../../../src/application/context/decisions/reverse/IReverseDecisionGateway.js";

describe("ReverseDecisionController", () => {
  let controller: ReverseDecisionController;
  let mockGateway: jest.Mocked<IReverseDecisionGateway>;

  beforeEach(() => {
    mockGateway = {
      reverseDecision: jest.fn(),
    } as jest.Mocked<IReverseDecisionGateway>;

    controller = new ReverseDecisionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      decisionId: "dec_123",
      reason: "Requirements changed",
    };

    const expectedResponse = {
      decisionId: "dec_123",
    };

    mockGateway.reverseDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.reverseDecision).toHaveBeenCalledWith(request);
  });
});
