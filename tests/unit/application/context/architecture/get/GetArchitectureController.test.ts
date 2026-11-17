import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetArchitectureController } from "../../../../../../src/application/context/architecture/get/GetArchitectureController.js";
import { IGetArchitectureGateway } from "../../../../../../src/application/context/architecture/get/IGetArchitectureGateway.js";
import { ArchitectureView } from "../../../../../../src/application/context/architecture/ArchitectureView.js";

describe("GetArchitectureController", () => {
  let controller: GetArchitectureController;
  let mockGateway: jest.Mocked<IGetArchitectureGateway>;

  beforeEach(() => {
    mockGateway = {
      getArchitecture: jest.fn(),
    } as jest.Mocked<IGetArchitectureGateway>;

    controller = new GetArchitectureController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockArchitecture: ArchitectureView = {
      architectureId: "arch_123",
      description: "Microservices architecture",
      organization: "Domain-driven",
      patterns: ["CQRS", "Event Sourcing"],
      principles: ["Single Responsibility"],
      dataStores: [],
      stack: ["TypeScript", "Node.js"],
      deprecated: false,
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    };

    mockGateway.getArchitecture.mockResolvedValue({ architecture: mockArchitecture });

    const response = await controller.handle({});

    expect(response.architecture).toEqual(mockArchitecture);
    expect(mockGateway.getArchitecture).toHaveBeenCalledWith({});
  });

  it("should return null architecture when none defined", async () => {
    mockGateway.getArchitecture.mockResolvedValue({ architecture: null });

    const response = await controller.handle({});

    expect(response.architecture).toBeNull();
    expect(mockGateway.getArchitecture).toHaveBeenCalledWith({});
  });
});
