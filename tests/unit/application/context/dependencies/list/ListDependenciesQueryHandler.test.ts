/**
 * Tests for GetDependenciesQueryHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetDependenciesQueryHandler } from "../../../../../../src/application/context/dependencies/get/GetDependenciesQueryHandler.js";
import { IDependencyViewReader } from "../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView.js";

describe("GetDependenciesQueryHandler", () => {
  let queryHandler: GetDependenciesQueryHandler;
  let mockReader: jest.Mocked<IDependencyViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
    } as jest.Mocked<IDependencyViewReader>;

    queryHandler = new GetDependenciesQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return all dependencies when no filter specified", async () => {
      const mockDependencies: DependencyView[] = [
        {
          dependencyId: "dep_123",
          consumerId: "comp_user",
          providerId: "comp_db",
          endpoint: "/api/users",
          contract: "REST",
          status: "active",
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
          removedAt: null,
          removalReason: null,
        },
      ];

      mockReader.findAll.mockResolvedValue(mockDependencies);

      const result = await queryHandler.execute();

      expect(result).toEqual(mockDependencies);
      expect(mockReader.findAll).toHaveBeenCalledWith(undefined);
    });

    it("should filter by consumer", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ consumer: "comp_user" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ consumer: "comp_user" });
    });

    it("should filter by provider", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ provider: "comp_db" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ provider: "comp_db" });
    });

    it("should filter by both consumer and provider", async () => {
      mockReader.findAll.mockResolvedValue([]);

      await queryHandler.execute({ consumer: "comp_user", provider: "comp_db" });

      expect(mockReader.findAll).toHaveBeenCalledWith({ consumer: "comp_user", provider: "comp_db" });
    });

    it("should return empty array when no dependencies exist", async () => {
      mockReader.findAll.mockResolvedValue([]);

      const result = await queryHandler.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
