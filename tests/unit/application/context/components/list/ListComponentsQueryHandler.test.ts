/**
 * Tests for GetComponentsQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetComponentsQueryHandler } from "../../../../../../src/application/context/components/get/GetComponentsQueryHandler.js";
import { IComponentViewReader } from "../../../../../../src/application/context/components/get/IComponentViewReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("GetComponentsQueryHandler", () => {
  let queryHandler: GetComponentsQueryHandler;
  let mockReader: jest.Mocked<IComponentViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
    } as jest.Mocked<IComponentViewReader>;

    queryHandler = new GetComponentsQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all components when no filter specified", async () => {
      const mockComponents: ComponentView[] = [
        {
          componentId: "comp_123",
          name: "UserService",
          type: "service",
          description: "Handles user operations",
          responsibility: "User management",
          path: "src/services/user",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          componentId: "comp_456",
          name: "OldCache",
          type: "cache",
          description: "Legacy caching layer",
          responsibility: "Caching",
          path: "src/cache/old",
          status: "deprecated",
          deprecationReason: "Replaced by NewCache",
          version: 2,
          createdAt: "2025-01-01T08:00:00Z",
          updatedAt: "2025-01-01T09:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockComponents);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockComponents);
      expect(result).toHaveLength(2);
      expect(mockReader.findAll).toHaveBeenCalledWith("all");
    });

    it("should filter by active status", async () => {
      const mockComponents: ComponentView[] = [
        {
          componentId: "comp_123",
          name: "UserService",
          type: "service",
          description: "Handles user operations",
          responsibility: "User management",
          path: "src/services/user",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
      ];

      mockReader.findAll.mockResolvedValue(mockComponents);

      const result = await queryHandler.execute("active");

      expect(result).toEqual(mockComponents);
      expect(mockReader.findAll).toHaveBeenCalledWith("active");
    });

    it("should filter by deprecated status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("deprecated");

      expect(mockReader.findAll).toHaveBeenCalledWith("deprecated");
    });

    it("should filter by removed status", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute("removed");

      expect(mockReader.findAll).toHaveBeenCalledWith("removed");
    });

    it("should return empty array when no components exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
