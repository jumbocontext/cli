import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { DefineArchitectureController } from "../../../../../../src/application/context/architecture/define/DefineArchitectureController.js";
import { IDefineArchitectureGateway } from "../../../../../../src/application/context/architecture/define/IDefineArchitectureGateway.js";

describe("DefineArchitectureController", () => {
  let controller: DefineArchitectureController;
  let mockGateway: jest.Mocked<IDefineArchitectureGateway>;

  beforeEach(() => {
    mockGateway = {
      defineArchitecture: jest.fn(),
    } as jest.Mocked<IDefineArchitectureGateway>;

    controller = new DefineArchitectureController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.defineArchitecture.mockResolvedValue({ architectureId: "architecture" });

    const response = await controller.handle({
      description: "Event-sourced DDD system",
      organization: "Clean Architecture",
      patterns: ["DDD", "CQRS"],
      principles: ["SRP"],
      dataStores: ["sqlite:relational:projections"],
      stack: ["TypeScript", "Node.js"],
    });

    expect(response.architectureId).toBe("architecture");
    expect(mockGateway.defineArchitecture).toHaveBeenCalledWith({
      description: "Event-sourced DDD system",
      organization: "Clean Architecture",
      patterns: ["DDD", "CQRS"],
      principles: ["SRP"],
      dataStores: ["sqlite:relational:projections"],
      stack: ["TypeScript", "Node.js"],
    });
  });

  it("should pass minimal request through to gateway", async () => {
    mockGateway.defineArchitecture.mockResolvedValue({ architectureId: "architecture" });

    await controller.handle({
      description: "Simple API",
      organization: "Layered",
    });

    expect(mockGateway.defineArchitecture).toHaveBeenCalledWith({
      description: "Simple API",
      organization: "Layered",
    });
  });
});
