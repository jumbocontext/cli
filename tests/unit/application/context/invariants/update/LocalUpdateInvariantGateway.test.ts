import { LocalUpdateInvariantGateway } from "../../../../../../src/application/context/invariants/update/LocalUpdateInvariantGateway";
import { UpdateInvariantCommandHandler } from "../../../../../../src/application/context/invariants/update/UpdateInvariantCommandHandler";
import { IInvariantUpdateReader } from "../../../../../../src/application/context/invariants/update/IInvariantUpdateReader";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView";
import { jest } from "@jest/globals";

describe("LocalUpdateInvariantGateway", () => {
  let gateway: LocalUpdateInvariantGateway;
  let mockCommandHandler: jest.Mocked<UpdateInvariantCommandHandler>;
  let mockInvariantReader: jest.Mocked<IInvariantUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateInvariantCommandHandler>;

    mockInvariantReader = {
      findById: jest.fn(),
    } as jest.Mocked<IInvariantUpdateReader>;

    gateway = new LocalUpdateInvariantGateway(
      mockCommandHandler,
      mockInvariantReader
    );
  });

  it("updates an invariant and returns response with updated fields", async () => {
    const mockView: InvariantView = {
      invariantId: "inv_001",
      title: "Updated Title",
      description: "Original description",
      rationale: "Original rationale",
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    };

    mockCommandHandler.execute.mockResolvedValue({ invariantId: "inv_001" });
    mockInvariantReader.findById.mockResolvedValue(mockView);

    const response = await gateway.updateInvariant({
      invariantId: "inv_001",
      title: "Updated Title",
    });

    expect(response.invariantId).toBe("inv_001");
    expect(response.updatedFields).toEqual(["title"]);
    expect(response.title).toBe("Updated Title");
    expect(response.version).toBe(2);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      invariantId: "inv_001",
      title: "Updated Title",
      description: undefined,
      rationale: undefined,
    });
    expect(mockCommandHandler.execute.mock.calls[0][0]).not.toHaveProperty("en" + "forcement");
    expect(mockInvariantReader.findById).toHaveBeenCalledWith("inv_001");
  });

  it("tracks multiple updated fields", async () => {
    const mockView: InvariantView = {
      invariantId: "inv_001",
      title: "New Title",
      description: "New Desc",
      rationale: "New Rationale",
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-03T00:00:00Z",
    };

    mockCommandHandler.execute.mockResolvedValue({ invariantId: "inv_001" });
    mockInvariantReader.findById.mockResolvedValue(mockView);

    const response = await gateway.updateInvariant({
      invariantId: "inv_001",
      title: "New Title",
      description: "New Desc",
      rationale: "New Rationale",
    });

    expect(response.updatedFields).toEqual([
      "title",
      "description",
      "rationale",
    ]);
  });

  it("returns response without view fields when view is not found", async () => {
    mockCommandHandler.execute.mockResolvedValue({ invariantId: "inv_001" });
    mockInvariantReader.findById.mockResolvedValue(null);

    const response = await gateway.updateInvariant({
      invariantId: "inv_001",
      title: "Updated Title",
    });

    expect(response.invariantId).toBe("inv_001");
    expect(response.updatedFields).toEqual(["title"]);
    expect(response.title).toBeUndefined();
    expect(response.version).toBeUndefined();
  });

  it("propagates errors from command handler", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Invariant not found")
    );

    await expect(
      gateway.updateInvariant({ invariantId: "inv_999" })
    ).rejects.toThrow("Invariant not found");
  });
});
