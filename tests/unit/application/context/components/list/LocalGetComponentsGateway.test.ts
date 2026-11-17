import { describe, it, expect, jest } from "@jest/globals";
import { LocalGetComponentsGateway } from "../../../../../../src/application/context/components/list/LocalGetComponentsGateway.js";
import { IComponentViewReader } from "../../../../../../src/application/context/components/get/IComponentViewReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("LocalGetComponentsGateway", () => {
  it("should delegate to componentViewReader.findAll with the requested status", async () => {
    const mockComponents: ComponentView[] = [
      {
        componentId: "comp_1",
        name: "TestComponent",
        type: "service",
        description: "A test component",
        responsibility: "Testing",
        path: "src/test",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ];

    const mockComponentViewReader: jest.Mocked<IComponentViewReader> = {
      findAll: jest.fn<IComponentViewReader["findAll"]>().mockResolvedValue(mockComponents),
      findByIds: jest.fn<IComponentViewReader["findByIds"]>(),
    };

    const gateway = new LocalGetComponentsGateway(mockComponentViewReader);
    const result = await gateway.getComponents({ status: "active" });

    expect(mockComponentViewReader.findAll).toHaveBeenCalledWith("active");
    expect(result).toEqual({ components: mockComponents });
  });

  it("should return empty components array when none found", async () => {
    const mockComponentViewReader: jest.Mocked<IComponentViewReader> = {
      findAll: jest.fn<IComponentViewReader["findAll"]>().mockResolvedValue([]),
      findByIds: jest.fn<IComponentViewReader["findByIds"]>(),
    };

    const gateway = new LocalGetComponentsGateway(mockComponentViewReader);
    const result = await gateway.getComponents({ status: "all" });

    expect(mockComponentViewReader.findAll).toHaveBeenCalledWith("all");
    expect(result).toEqual({ components: [] });
  });
});
