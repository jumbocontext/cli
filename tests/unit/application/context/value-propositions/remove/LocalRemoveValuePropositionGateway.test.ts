import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRemoveValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/remove/LocalRemoveValuePropositionGateway.js";
import { RemoveValuePropositionCommandHandler } from "../../../../../../src/application/context/value-propositions/remove/RemoveValuePropositionCommandHandler.js";
import { IValuePropositionRemoveReader } from "../../../../../../src/application/context/value-propositions/remove/IValuePropositionRemoveReader.js";
import { UUID } from "../../../../../../src/domain/BaseEvent.js";

describe("LocalRemoveValuePropositionGateway", () => {
  let gateway: LocalRemoveValuePropositionGateway;
  let mockCommandHandler: jest.Mocked<RemoveValuePropositionCommandHandler>;
  let mockReader: jest.Mocked<IValuePropositionRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveValuePropositionCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IValuePropositionRemoveReader>;

    gateway = new LocalRemoveValuePropositionGateway(mockCommandHandler, mockReader);
  });

  it("should look up value proposition, execute command, and return response with title", async () => {
    const valuePropositionId = "vp-123" as UUID;

    mockReader.findById.mockResolvedValue({
      valuePropositionId,
      title: "Fast onboarding",
      description: "Users can get started in minutes",
      benefit: "Reduced time to value",
      measurableOutcome: "< 5 min setup",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });
    mockCommandHandler.execute.mockResolvedValue({
      valuePropositionId,
      title: "Fast onboarding",
    });

    const response = await gateway.removeValueProposition({
      valuePropositionId,
    });

    expect(response.valuePropositionId).toBe(valuePropositionId);
    expect(response.title).toBe("Fast onboarding");
    expect(mockReader.findById).toHaveBeenCalledWith(valuePropositionId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      valuePropositionId,
    });
  });

  it("should throw when value proposition is not found", async () => {
    mockReader.findById.mockResolvedValue(null);

    await expect(
      gateway.removeValueProposition({
        valuePropositionId: "nonexistent-id",
      })
    ).rejects.toThrow("Value proposition with ID nonexistent-id not found");

    expect(mockCommandHandler.execute).not.toHaveBeenCalled();
  });
});
