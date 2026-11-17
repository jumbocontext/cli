import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetArchitectureGateway } from "../../../../../../src/application/context/architecture/get/LocalGetArchitectureGateway.js";
import { IArchitectureReader } from "../../../../../../src/application/context/architecture/IArchitectureReader.js";
import { ArchitectureView } from "../../../../../../src/application/context/architecture/ArchitectureView.js";

describe("LocalGetArchitectureGateway", () => {
  let gateway: LocalGetArchitectureGateway;
  let mockReader: jest.Mocked<IArchitectureReader>;

  beforeEach(() => {
    mockReader = {
      find: jest.fn(),
    } as jest.Mocked<IArchitectureReader>;

    gateway = new LocalGetArchitectureGateway(mockReader);
  });

  it("should return architecture from the reader", async () => {
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

    mockReader.find.mockResolvedValue(mockArchitecture);

    const response = await gateway.getArchitecture({});

    expect(response.architecture).toEqual(mockArchitecture);
    expect(mockReader.find).toHaveBeenCalled();
  });

  it("should return null architecture when none defined", async () => {
    mockReader.find.mockResolvedValue(null);

    const response = await gateway.getArchitecture({});

    expect(response.architecture).toBeNull();
    expect(mockReader.find).toHaveBeenCalled();
  });
});
