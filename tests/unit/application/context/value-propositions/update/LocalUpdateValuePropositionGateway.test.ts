import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/update/LocalUpdateValuePropositionGateway.js";
import { UpdateValuePropositionCommandHandler } from "../../../../../../src/application/context/value-propositions/update/UpdateValuePropositionCommandHandler.js";
import { IValuePropositionUpdateReader } from "../../../../../../src/application/context/value-propositions/update/IValuePropositionUpdateReader.js";
import { UUID } from "../../../../../../src/domain/BaseEvent.js";

describe("LocalUpdateValuePropositionGateway", () => {
  let gateway: LocalUpdateValuePropositionGateway;
  let mockCommandHandler: jest.Mocked<UpdateValuePropositionCommandHandler>;
  let mockViewReader: jest.Mocked<IValuePropositionUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateValuePropositionCommandHandler>;

    mockViewReader = {
      findById: jest.fn(),
    } as jest.Mocked<IValuePropositionUpdateReader>;

    gateway = new LocalUpdateValuePropositionGateway(mockCommandHandler, mockViewReader);
  });

  it("should execute command and return response with updated view", async () => {
    const valuePropositionId = "vp-123" as UUID;

    mockCommandHandler.execute.mockResolvedValue({
      valuePropositionId,
    });
    mockViewReader.findById.mockResolvedValue({
      valuePropositionId,
      title: "Updated Title",
      description: "A description",
      benefit: "A benefit",
      measurableOutcome: null,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    const response = await gateway.updateValueProposition({
      id: valuePropositionId,
      title: "Updated Title",
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(response.title).toBe("Updated Title");
    expect(response.version).toBe(2);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      id: valuePropositionId,
      title: "Updated Title",
      description: undefined,
      benefit: undefined,
      measurableOutcome: undefined,
    });
    expect(mockViewReader.findById).toHaveBeenCalledWith(valuePropositionId);
  });

  it("should return response without view fields when view is not found", async () => {
    const valuePropositionId = "vp-456" as UUID;

    mockCommandHandler.execute.mockResolvedValue({
      valuePropositionId,
    });
    mockViewReader.findById.mockResolvedValue(null);

    const response = await gateway.updateValueProposition({
      id: valuePropositionId,
      description: "New description",
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(response.title).toBeUndefined();
    expect(response.version).toBeUndefined();
  });

  it("should pass measurableOutcome null to clear the field", async () => {
    const valuePropositionId = "vp-789" as UUID;

    mockCommandHandler.execute.mockResolvedValue({
      valuePropositionId,
    });
    mockViewReader.findById.mockResolvedValue({
      valuePropositionId,
      title: "Some Title",
      description: "A description",
      benefit: "A benefit",
      measurableOutcome: null,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-03T00:00:00Z",
    });

    const response = await gateway.updateValueProposition({
      id: valuePropositionId,
      measurableOutcome: null,
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({ measurableOutcome: null })
    );
  });
});
