import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateDecisionController } from "../../../../../../src/application/context/decisions/update/UpdateDecisionController.js";
import { IUpdateDecisionGateway } from "../../../../../../src/application/context/decisions/update/IUpdateDecisionGateway.js";

describe("UpdateDecisionController", () => {
  let controller: UpdateDecisionController;
  let mockGateway: jest.Mocked<IUpdateDecisionGateway>;

  beforeEach(() => {
    mockGateway = {
      updateDecision: jest.fn(),
    } as jest.Mocked<IUpdateDecisionGateway>;

    controller = new UpdateDecisionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      decisionId: "dec_123",
      title: "Use JWT with refresh tokens",
      context: "Updated context",
      rationale: "Updated rationale",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Updated consequences",
    };

    const expectedResponse = {
      decisionId: "dec_123",
    };

    mockGateway.updateDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateDecision).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      decisionId: "dec_456",
      title: "Updated title",
    };

    const expectedResponse = {
      decisionId: "dec_456",
    };

    mockGateway.updateDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateDecision).toHaveBeenCalledWith(request);
  });
});
