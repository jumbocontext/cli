import { describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { ISearchDecisionsGateway } from "../../../../../../src/application/context/decisions/search/ISearchDecisionsGateway.js";
import { SearchDecisionsController } from "../../../../../../src/application/context/decisions/search/SearchDecisionsController.js";
import { SearchDecisionsRequest } from "../../../../../../src/application/context/decisions/search/SearchDecisionsRequest.js";
import { SearchDecisionsResponse } from "../../../../../../src/application/context/decisions/search/SearchDecisionsResponse.js";

describe("SearchDecisionsController", () => {
  const decision: DecisionView = {
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
  };

  it("should delegate to gateway with the request", async () => {
    const expectedResponse: SearchDecisionsResponse = { decisions: [decision] };
    const mockGateway: jest.Mocked<ISearchDecisionsGateway> = {
      searchDecisions: jest.fn<ISearchDecisionsGateway["searchDecisions"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new SearchDecisionsController(mockGateway);
    const request: SearchDecisionsRequest = { criteria: { title: "Event" } };

    const result = await controller.handle(request);

    expect(mockGateway.searchDecisions).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through empty criteria", async () => {
    const mockGateway: jest.Mocked<ISearchDecisionsGateway> = {
      searchDecisions: jest.fn<ISearchDecisionsGateway["searchDecisions"]>().mockResolvedValue({ decisions: [] }),
    };

    const controller = new SearchDecisionsController(mockGateway);
    const request: SearchDecisionsRequest = { criteria: {} };

    const result = await controller.handle(request);

    expect(mockGateway.searchDecisions).toHaveBeenCalledWith(request);
    expect(result.decisions).toEqual([]);
  });
});
