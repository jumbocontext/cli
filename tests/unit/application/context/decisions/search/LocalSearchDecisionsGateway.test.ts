import { describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { IDecisionViewReader } from "../../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { LocalSearchDecisionsGateway } from "../../../../../../src/application/context/decisions/search/LocalSearchDecisionsGateway.js";

describe("LocalSearchDecisionsGateway", () => {
  it("should delegate to decisionViewReader.search with criteria", async () => {
    const expectedDecisions: DecisionView[] = [
      {
        decisionId: "dec_1",
        title: "Use Event Sourcing",
        context: "Need durable history",
        rationale: "Provides auditability",
        alternatives: ["CRUD"],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ];

    const mockReader: jest.Mocked<IDecisionViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDecisionViewReader["search"]>().mockResolvedValue(expectedDecisions),
    };

    const gateway = new LocalSearchDecisionsGateway(mockReader);
    const result = await gateway.searchDecisions({ criteria: { title: "Event", status: "active" } });

    expect(mockReader.search).toHaveBeenCalledWith({ title: "Event", status: "active" });
    expect(result.decisions).toEqual(expectedDecisions);
  });

  it("should return empty decisions when search finds no matches", async () => {
    const mockReader: jest.Mocked<IDecisionViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDecisionViewReader["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchDecisionsGateway(mockReader);
    const result = await gateway.searchDecisions({ criteria: { query: "nonexistent" } });

    expect(result.decisions).toEqual([]);
  });
});
