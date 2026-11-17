import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SupersedeDecisionController } from "../../../../../../src/application/context/decisions/supersede/SupersedeDecisionController.js";
import { ISupersedeDecisionGateway } from "../../../../../../src/application/context/decisions/supersede/ISupersedeDecisionGateway.js";

describe("SupersedeDecisionController", () => {
  let controller: SupersedeDecisionController;
  let mockGateway: jest.Mocked<ISupersedeDecisionGateway>;

  beforeEach(() => {
    mockGateway = {
      supersedeDecision: jest.fn(),
    } as jest.Mocked<ISupersedeDecisionGateway>;

    controller = new SupersedeDecisionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      decisionId: "dec_123",
      supersededBy: "dec_456",
    };

    const expectedResponse = {
      decisionId: "dec_123",
    };

    mockGateway.supersedeDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.supersedeDecision).toHaveBeenCalledWith(request);
  });
});
