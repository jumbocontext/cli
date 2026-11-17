import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetDecisionsController } from "../../../../../../src/application/context/decisions/get/GetDecisionsController.js";
import { IGetDecisionsGateway } from "../../../../../../src/application/context/decisions/get/IGetDecisionsGateway.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";

describe("GetDecisionsController", () => {
  let controller: GetDecisionsController;
  let mockGateway: jest.Mocked<IGetDecisionsGateway>;

  beforeEach(() => {
    mockGateway = {
      getDecisions: jest.fn(),
    } as jest.Mocked<IGetDecisionsGateway>;

    controller = new GetDecisionsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockDecisions: DecisionView[] = [
      {
        decisionId: "dec_123",
        title: "Use Event Sourcing",
        context: "Need to track all state changes",
        rationale: "Enables full audit trail",
        alternatives: ["CRUD"],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGateway.getDecisions.mockResolvedValue({ decisions: mockDecisions });

    const response = await controller.handle({ status: "all" });

    expect(response.decisions).toEqual(mockDecisions);
    expect(mockGateway.getDecisions).toHaveBeenCalledWith({ status: "all" });
  });

  it("should pass status filter through to gateway", async () => {
    mockGateway.getDecisions.mockResolvedValue({ decisions: [] });

    await controller.handle({ status: "active" });

    expect(mockGateway.getDecisions).toHaveBeenCalledWith({ status: "active" });
  });
});
