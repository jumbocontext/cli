import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddDecisionController } from "../../../../../../src/application/context/decisions/add/AddDecisionController.js";
import { IAddDecisionGateway } from "../../../../../../src/application/context/decisions/add/IAddDecisionGateway.js";

describe("AddDecisionController", () => {
  let controller: AddDecisionController;
  let mockGateway: jest.Mocked<IAddDecisionGateway>;

  beforeEach(() => {
    mockGateway = {
      addDecision: jest.fn(),
    } as jest.Mocked<IAddDecisionGateway>;

    controller = new AddDecisionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      title: "Use JWT tokens",
      context: "Need stateless auth",
      rationale: "Scalable across services",
      alternatives: ["Sessions", "OAuth2"],
      consequences: "Requires token refresh strategy",
    };

    const expectedResponse = {
      decisionId: "dec_123",
    };

    mockGateway.addDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDecision).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      title: "Use PostgreSQL",
      context: "Need relational database",
    };

    const expectedResponse = {
      decisionId: "dec_456",
    };

    mockGateway.addDecision.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addDecision).toHaveBeenCalledWith(request);
  });
});
