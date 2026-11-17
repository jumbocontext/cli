import { describe, it, expect, jest } from "@jest/globals";
import { LocalSearchComponentsGateway } from "../../../../../../src/application/context/components/search/LocalSearchComponentsGateway.js";
import { IComponentViewReader } from "../../../../../../src/application/context/components/get/IComponentViewReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("LocalSearchComponentsGateway", () => {
  it("should delegate to componentViewReader.search with criteria", async () => {
    const expectedComponents: ComponentView[] = [
      {
        componentId: "comp_1",
        name: "AuthService",
        type: "service",
        description: "Handles auth",
        responsibility: "Auth",
        path: "src/auth",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ];

    const mockReader: jest.Mocked<IComponentViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IComponentViewReader["search"]>().mockResolvedValue(expectedComponents),
    };

    const gateway = new LocalSearchComponentsGateway(mockReader);
    const result = await gateway.searchComponents({ criteria: { name: "Auth" } });

    expect(mockReader.search).toHaveBeenCalledWith({ name: "Auth" });
    expect(result.components).toEqual(expectedComponents);
  });

  it("should return empty components when search finds no matches", async () => {
    const mockReader: jest.Mocked<IComponentViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IComponentViewReader["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchComponentsGateway(mockReader);
    const result = await gateway.searchComponents({ criteria: { query: "nonexistent" } });

    expect(result.components).toEqual([]);
  });
});
