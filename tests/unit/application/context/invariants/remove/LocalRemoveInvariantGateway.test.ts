import { LocalRemoveInvariantGateway } from "../../../../../../src/application/context/invariants/remove/LocalRemoveInvariantGateway";
import { RemoveInvariantCommandHandler } from "../../../../../../src/application/context/invariants/remove/RemoveInvariantCommandHandler";
import { IInvariantRemoveReader } from "../../../../../../src/application/context/invariants/remove/IInvariantRemoveReader";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView";
import { jest } from "@jest/globals";

describe("LocalRemoveInvariantGateway", () => {
  let gateway: LocalRemoveInvariantGateway;
  let mockCommandHandler: jest.Mocked<RemoveInvariantCommandHandler>;
  let mockInvariantReader: jest.Mocked<IInvariantRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveInvariantCommandHandler>;

    mockInvariantReader = {
      findById: jest.fn(),
    } as jest.Mocked<IInvariantRemoveReader>;

    gateway = new LocalRemoveInvariantGateway(
      mockCommandHandler,
      mockInvariantReader
    );
  });

  it("removes an invariant successfully", async () => {
    const mockView: InvariantView = {
      invariantId: "inv_001",
      title: "All IDs must be UUIDs",
      description: "Every entity identifier must be a valid UUID v4",
      rationale: "Ensures global uniqueness",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    mockInvariantReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockResolvedValue(undefined);

    const response = await gateway.removeInvariant({
      invariantId: "inv_001",
    });

    expect(response.invariantId).toBe("inv_001");
    expect(response.title).toBe("All IDs must be UUIDs");
    expect(mockInvariantReader.findById).toHaveBeenCalledWith("inv_001");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      invariantId: "inv_001",
    });
  });

  it("falls back to invariantId when view is not found", async () => {
    mockInvariantReader.findById.mockResolvedValue(null);
    mockCommandHandler.execute.mockResolvedValue(undefined);

    const response = await gateway.removeInvariant({ invariantId: "inv_789" });

    expect(response.invariantId).toBe("inv_789");
    expect(response.title).toBe("inv_789");
  });

  it("propagates errors from command handler", async () => {
    const mockView: InvariantView = {
      invariantId: "inv_001",
      title: "All IDs must be UUIDs",
      description: "Every entity identifier must be a valid UUID v4",
      rationale: "Ensures global uniqueness",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    mockInvariantReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Invariant with ID inv_001 not found")
    );

    await expect(
      gateway.removeInvariant({ invariantId: "inv_001" })
    ).rejects.toThrow("Invariant with ID inv_001 not found");
  });
});
