import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetInvariantsGateway } from "../../../../../../src/application/context/invariants/get/LocalGetInvariantsGateway.js";
import { IInvariantViewReader } from "../../../../../../src/application/context/invariants/get/IInvariantViewReader.js";
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

describe("LocalGetInvariantsGateway", () => {
  let gateway: LocalGetInvariantsGateway;
  let mockReader: jest.Mocked<IInvariantViewReader>;

  beforeEach(() => {
    mockReader = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
    } as jest.Mocked<IInvariantViewReader>;

    gateway = new LocalGetInvariantsGateway(mockReader);
  });

  describe("getInvariant", () => {
    it("should delegate to findById and return result", async () => {
      mockReader.findById.mockResolvedValue(sampleInvariant);

      const response = await gateway.getInvariant({ invariantId: "inv_123" });

      expect(response).toEqual({ invariant: sampleInvariant });
      expect(mockReader.findById).toHaveBeenCalledWith("inv_123");
    });

    it("should return null when invariant not found", async () => {
      mockReader.findById.mockResolvedValue(null);

      const response = await gateway.getInvariant({ invariantId: "inv_999" });

      expect(response).toEqual({ invariant: null });
      expect(mockReader.findById).toHaveBeenCalledWith("inv_999");
    });
  });

  describe("getInvariants", () => {
    it("should delegate to findByIds and return results", async () => {
      mockReader.findByIds.mockResolvedValue([sampleInvariant]);

      const response = await gateway.getInvariants({ ids: ["inv_123"] });

      expect(response).toEqual({ invariants: [sampleInvariant] });
      expect(mockReader.findByIds).toHaveBeenCalledWith(["inv_123"]);
    });

    it("should return empty array when no matches", async () => {
      mockReader.findByIds.mockResolvedValue([]);

      const response = await gateway.getInvariants({ ids: ["inv_999"] });

      expect(response).toEqual({ invariants: [] });
    });
  });

  describe("getAllInvariants", () => {
    it("should delegate to findAll and return results", async () => {
      mockReader.findAll.mockResolvedValue([sampleInvariant]);

      const response = await gateway.getAllInvariants({});

      expect(response).toEqual({ invariants: [sampleInvariant] });
      expect(mockReader.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no invariants exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const response = await gateway.getAllInvariants({});

      expect(response).toEqual({ invariants: [] });
    });
  });
});
