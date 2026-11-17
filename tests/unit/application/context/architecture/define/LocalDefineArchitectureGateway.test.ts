import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalDefineArchitectureGateway } from "../../../../../../src/application/context/architecture/define/LocalDefineArchitectureGateway.js";
import { IArchitectureDefinedEventWriter } from "../../../../../../src/application/context/architecture/define/IArchitectureDefinedEventWriter.js";
import { IArchitectureDefineReader } from "../../../../../../src/application/context/architecture/define/IArchitectureDefineReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ArchitectureErrorMessages } from "../../../../../../src/domain/architecture/Constants.js";

describe("LocalDefineArchitectureGateway", () => {
  let gateway: LocalDefineArchitectureGateway;
  let mockEventWriter: jest.Mocked<IArchitectureDefinedEventWriter>;
  let mockReader: jest.Mocked<IArchitectureDefineReader>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn<IArchitectureDefinedEventWriter["append"]>().mockResolvedValue({ nextSeq: 1 }),
    } as jest.Mocked<IArchitectureDefinedEventWriter>;

    mockReader = {
      findById: jest.fn<IArchitectureDefineReader["findById"]>().mockResolvedValue(null),
    } as jest.Mocked<IArchitectureDefineReader>;

    mockEventBus = {
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
      subscribe: jest.fn<IEventBus["subscribe"]>(),
    } as jest.Mocked<IEventBus>;

    gateway = new LocalDefineArchitectureGateway(mockEventWriter, mockReader, mockEventBus);
  });

  it("should define architecture and return architectureId", async () => {
    const response = await gateway.defineArchitecture({
      description: "Event-sourced DDD system",
      organization: "Clean Architecture",
      patterns: ["DDD", "CQRS"],
      dataStores: ["sqlite:relational:projections"],
      stack: ["TypeScript"],
    });

    expect(response.architectureId).toBe("architecture");
    expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it("should throw if architecture already exists", async () => {
    mockReader.findById.mockResolvedValue({
      architectureId: "architecture",
      description: "Existing",
      organization: "Existing",
      patterns: [],
      principles: [],
      dataStores: [],
      stack: [],
      deprecated: false,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    await expect(
      gateway.defineArchitecture({
        description: "New system",
        organization: "Clean Architecture",
      })
    ).rejects.toThrow(ArchitectureErrorMessages.ALREADY_DEFINED);

    expect(mockEventWriter.append).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw DEPRECATED if architecture exists and is deprecated", async () => {
    mockReader.findById.mockResolvedValue({
      architectureId: "architecture",
      description: "Existing",
      organization: "Existing",
      patterns: [],
      principles: [],
      dataStores: [],
      stack: [],
      deprecated: true,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    await expect(
      gateway.defineArchitecture({
        description: "New system",
        organization: "Clean Architecture",
      })
    ).rejects.toThrow(ArchitectureErrorMessages.DEPRECATED);

    expect(mockEventWriter.append).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it("should check for existing architecture before persisting", async () => {
    await gateway.defineArchitecture({
      description: "Simple API",
      organization: "Layered",
    });

    expect(mockReader.findById).toHaveBeenCalledWith("architecture");
  });
});
