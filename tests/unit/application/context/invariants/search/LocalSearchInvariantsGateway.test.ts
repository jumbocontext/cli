import { describe, it, expect, jest } from "@jest/globals";
import { IInvariantViewReader } from "../../../../../../src/application/context/invariants/get/IInvariantViewReader.js";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView.js";
import { LocalSearchInvariantsGateway } from "../../../../../../src/application/context/invariants/search/LocalSearchInvariantsGateway.js";

describe("LocalSearchInvariantsGateway", () => {
  it("should delegate to invariantViewReader.search with criteria", async () => {
    const expectedInvariants: InvariantView[] = [
      {
        invariantId: "inv_1",
        title: "Clean Architecture",
        description: "Keep layer boundaries clear",
        rationale: "Reduces coupling",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ];

    const mockReader: jest.Mocked<IInvariantViewReader> = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn<IInvariantViewReader["search"]>().mockResolvedValue(expectedInvariants),
    };

    const gateway = new LocalSearchInvariantsGateway(mockReader);
    const result = await gateway.searchInvariants({ criteria: { title: "Clean" } });

    expect(mockReader.search).toHaveBeenCalledWith({ title: "Clean" });
    expect(result.invariants).toEqual(expectedInvariants);
  });

  it("should return empty invariants when search finds no matches", async () => {
    const mockReader: jest.Mocked<IInvariantViewReader> = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn<IInvariantViewReader["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchInvariantsGateway(mockReader);
    const result = await gateway.searchInvariants({ criteria: { query: "nonexistent" } });

    expect(result.invariants).toEqual([]);
  });
});
