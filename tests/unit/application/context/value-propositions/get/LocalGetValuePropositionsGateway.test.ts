import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetValuePropositionsGateway } from "../../../../../../src/application/context/value-propositions/get/LocalGetValuePropositionsGateway.js";
import { IValuePropositionContextReader } from "../../../../../../src/application/context/value-propositions/query/IValuePropositionContextReader.js";
import { ValuePropositionView } from "../../../../../../src/application/context/value-propositions/ValuePropositionView.js";

describe("LocalGetValuePropositionsGateway", () => {
  let gateway: LocalGetValuePropositionsGateway;
  let mockReader: jest.Mocked<IValuePropositionContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IValuePropositionContextReader>;

    gateway = new LocalGetValuePropositionsGateway(mockReader);
  });

  it("should return values from the context reader", async () => {
    const mockValues: ValuePropositionView[] = [
      {
        valuePropositionId: "value_123",
        title: "Persistent Context",
        description: "Context that persists across sessions",
        benefit: "Never lose context again",
        measurableOutcome: "100% context retention",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
      {
        valuePropositionId: "value_456",
        title: "Transferable Memory",
        description: "Memory that transfers across agents",
        benefit: "Switch agents without losing context",
        measurableOutcome: null,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockReader.findAllActive.mockResolvedValue(mockValues);

    const result = await gateway.getValuePropositions({});

    expect(result.values).toEqual(mockValues);
    expect(result.values).toHaveLength(2);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("should return empty values when none exist", async () => {
    mockReader.findAllActive.mockResolvedValue([]);

    const result = await gateway.getValuePropositions({});

    expect(result.values).toEqual([]);
    expect(result.values).toHaveLength(0);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });
});
