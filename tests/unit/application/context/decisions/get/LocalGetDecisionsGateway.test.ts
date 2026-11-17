import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetDecisionsGateway } from "../../../../../../src/application/context/decisions/get/LocalGetDecisionsGateway.js";
import { IDecisionViewReader } from "../../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";

describe("LocalGetDecisionsGateway", () => {
  let gateway: LocalGetDecisionsGateway;
  let mockReader: jest.Mocked<IDecisionViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
    } as jest.Mocked<IDecisionViewReader>;

    gateway = new LocalGetDecisionsGateway(mockReader);
  });

  it("should delegate to reader and return decisions", async () => {
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

    mockReader.findAll.mockResolvedValue(mockDecisions);

    const response = await gateway.getDecisions({ status: "all" });

    expect(response.decisions).toEqual(mockDecisions);
    expect(mockReader.findAll).toHaveBeenCalledWith("all");
  });

  it("should pass status filter to reader", async () => {
    mockReader.findAll.mockResolvedValue([]);

    await gateway.getDecisions({ status: "active" });

    expect(mockReader.findAll).toHaveBeenCalledWith("active");
  });
});
