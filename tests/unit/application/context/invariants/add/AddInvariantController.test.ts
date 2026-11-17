import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddInvariantController } from "../../../../../../src/application/context/invariants/add/AddInvariantController.js";
import { IAddInvariantGateway } from "../../../../../../src/application/context/invariants/add/IAddInvariantGateway.js";

describe("AddInvariantController", () => {
  let controller: AddInvariantController;
  let mockGateway: jest.Mocked<IAddInvariantGateway>;

  beforeEach(() => {
    mockGateway = {
      addInvariant: jest.fn(),
    } as jest.Mocked<IAddInvariantGateway>;

    controller = new AddInvariantController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      title: "HTTPS only",
      description: "All API calls must use HTTPS",
      rationale: "Security requirement",
    };

    const expectedResponse = {
      invariantId: "inv_123",
    };

    mockGateway.addInvariant.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addInvariant).toHaveBeenCalledWith(request);
  });

  it("should handle request without optional rationale", async () => {
    const request = {
      title: "80% test coverage",
      description: "All code must have at least 80% test coverage",
    };

    const expectedResponse = {
      invariantId: "inv_456",
    };

    mockGateway.addInvariant.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addInvariant).toHaveBeenCalledWith(request);
  });
});
