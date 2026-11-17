import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddInvariantGateway } from "../../../../../../src/application/context/invariants/add/LocalAddInvariantGateway.js";
import { AddInvariantCommandHandler } from "../../../../../../src/application/context/invariants/add/AddInvariantCommandHandler.js";

describe("LocalAddInvariantGateway", () => {
  let gateway: LocalAddInvariantGateway;
  let mockCommandHandler: jest.Mocked<AddInvariantCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddInvariantCommandHandler>;

    gateway = new LocalAddInvariantGateway(mockCommandHandler);
  });

  it("should delegate to command handler and return response", async () => {
    const request = {
      title: "HTTPS only",
      description: "All API calls must use HTTPS",
      rationale: "Security requirement",
    };

    mockCommandHandler.execute.mockResolvedValue({
      invariantId: "inv_123",
    });

    const response = await gateway.addInvariant(request);

    expect(response).toEqual({ invariantId: "inv_123" });
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "HTTPS only",
      description: "All API calls must use HTTPS",
      rationale: "Security requirement",
    });
    expect(mockCommandHandler.execute.mock.calls[0][0]).not.toHaveProperty("en" + "forcement");
  });

  it("should pass undefined rationale when not provided", async () => {
    const request = {
      title: "80% test coverage",
      description: "All code must have at least 80% test coverage",
    };

    mockCommandHandler.execute.mockResolvedValue({
      invariantId: "inv_456",
    });

    const response = await gateway.addInvariant(request);

    expect(response).toEqual({ invariantId: "inv_456" });
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "80% test coverage",
      description: "All code must have at least 80% test coverage",
      rationale: undefined,
    });
    expect(mockCommandHandler.execute.mock.calls[0][0]).not.toHaveProperty("en" + "forcement");
  });
});
