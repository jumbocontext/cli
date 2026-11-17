import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/add/LocalAddValuePropositionGateway.js";
import { AddValuePropositionCommandHandler } from "../../../../../../src/application/context/value-propositions/add/AddValuePropositionCommandHandler.js";
import { IValuePropositionUpdateReader } from "../../../../../../src/application/context/value-propositions/update/IValuePropositionUpdateReader.js";

describe("LocalAddValuePropositionGateway", () => {
  let gateway: LocalAddValuePropositionGateway;
  let mockCommandHandler: jest.Mocked<AddValuePropositionCommandHandler>;
  let mockViewReader: jest.Mocked<IValuePropositionUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddValuePropositionCommandHandler>;

    mockViewReader = {
      findById: jest.fn(),
    } as jest.Mocked<IValuePropositionUpdateReader>;

    gateway = new LocalAddValuePropositionGateway(mockCommandHandler, mockViewReader);
  });

  it("should execute command and return response with view data", async () => {
    const valuePropositionId = "value_123";

    mockCommandHandler.execute.mockResolvedValue({ valuePropositionId });
    mockViewReader.findById.mockResolvedValue({
      valuePropositionId,
      title: "Persistent context",
      description: "Maintain context across sessions",
      benefit: "Developers don't lose work",
      measurableOutcome: "Zero context loss",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const response = await gateway.addValueProposition({
      title: "Persistent context",
      description: "Maintain context across sessions",
      benefit: "Developers don't lose work",
      measurableOutcome: "Zero context loss",
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(response.title).toBe("Persistent context");
    expect(response.measurableOutcome).toBe("Zero context loss");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Persistent context",
      description: "Maintain context across sessions",
      benefit: "Developers don't lose work",
      measurableOutcome: "Zero context loss",
    });
    expect(mockViewReader.findById).toHaveBeenCalledWith(valuePropositionId);
  });

  it("should fall back to request title when view is not found", async () => {
    const valuePropositionId = "value_456";

    mockCommandHandler.execute.mockResolvedValue({ valuePropositionId });
    mockViewReader.findById.mockResolvedValue(null);

    const response = await gateway.addValueProposition({
      title: "Model-agnostic",
      description: "Works with any LLM",
      benefit: "Switch providers freely",
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(response.title).toBe("Model-agnostic");
    expect(response.measurableOutcome).toBeUndefined();
  });
});
