import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetInvariantsController } from "../../../../../../src/application/context/invariants/get/GetInvariantsController.js";
import { IGetInvariantsGateway } from "../../../../../../src/application/context/invariants/get/IGetInvariantsGateway.js";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView.js";

const sampleInvariant: InvariantView = {
  invariantId: "inv_123",
  title: "Single Responsibility",
  description: "Each class/module has one reason to change",
  rationale: "Reduces coupling",
  version: 1,
  createdAt: "2025-01-01T10:00:00Z",
  updatedAt: "2025-01-01T10:00:00Z",
};

describe("GetInvariantsController", () => {
  let controller: GetInvariantsController;
  let mockGateway: jest.Mocked<IGetInvariantsGateway>;

  beforeEach(() => {
    mockGateway = {
      getInvariant: jest.fn(),
      getInvariants: jest.fn(),
      getAllInvariants: jest.fn(),
    } as jest.Mocked<IGetInvariantsGateway>;

    controller = new GetInvariantsController(mockGateway);
  });

  describe("getInvariant", () => {
    it("should delegate to gateway", async () => {
      const request = { invariantId: "inv_123" };
      const expectedResponse = { invariant: sampleInvariant };
      mockGateway.getInvariant.mockResolvedValue(expectedResponse);

      const response = await controller.getInvariant(request);

      expect(response).toEqual(expectedResponse);
      expect(mockGateway.getInvariant).toHaveBeenCalledWith(request);
    });
  });

  describe("getInvariants", () => {
    it("should delegate to gateway", async () => {
      const request = { ids: ["inv_123", "inv_456"] };
      const expectedResponse = { invariants: [sampleInvariant] };
      mockGateway.getInvariants.mockResolvedValue(expectedResponse);

      const response = await controller.getInvariants(request);

      expect(response).toEqual(expectedResponse);
      expect(mockGateway.getInvariants).toHaveBeenCalledWith(request);
    });
  });

  describe("getAllInvariants", () => {
    it("should delegate to gateway", async () => {
      const expectedResponse = { invariants: [sampleInvariant] };
      mockGateway.getAllInvariants.mockResolvedValue(expectedResponse);

      const response = await controller.getAllInvariants({});

      expect(response).toEqual(expectedResponse);
      expect(mockGateway.getAllInvariants).toHaveBeenCalledWith({});
    });
  });
});
