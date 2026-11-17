import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateArchitectureController } from "../../../../../../src/application/context/architecture/update/UpdateArchitectureController.js";
import { IUpdateArchitectureGateway } from "../../../../../../src/application/context/architecture/update/IUpdateArchitectureGateway.js";

describe("UpdateArchitectureController", () => {
  let controller: UpdateArchitectureController;
  let mockGateway: jest.Mocked<IUpdateArchitectureGateway>;

  beforeEach(() => {
    mockGateway = {
      updateArchitecture: jest.fn(),
    } as jest.Mocked<IUpdateArchitectureGateway>;

    controller = new UpdateArchitectureController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.updateArchitecture.mockResolvedValue({ architectureId: "architecture" });

    const response = await controller.handle({
      description: "Updated DDD system",
      organization: "Hexagonal",
      patterns: ["DDD", "CQRS", "EventSourcing"],
      principles: ["SOLID", "DRY"],
      dataStores: ["sqlite:relational:projections"],
      stack: ["TypeScript", "Node.js"],
    });

    expect(response.architectureId).toBe("architecture");
    expect(mockGateway.updateArchitecture).toHaveBeenCalledWith({
      description: "Updated DDD system",
      organization: "Hexagonal",
      patterns: ["DDD", "CQRS", "EventSourcing"],
      principles: ["SOLID", "DRY"],
      dataStores: ["sqlite:relational:projections"],
      stack: ["TypeScript", "Node.js"],
    });
  });

  it("should pass partial request through to gateway", async () => {
    mockGateway.updateArchitecture.mockResolvedValue({ architectureId: "architecture" });

    await controller.handle({
      description: "Updated overview",
    });

    expect(mockGateway.updateArchitecture).toHaveBeenCalledWith({
      description: "Updated overview",
    });
  });
});
