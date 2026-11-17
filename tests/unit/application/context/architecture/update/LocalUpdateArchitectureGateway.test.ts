import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateArchitectureGateway } from "../../../../../../src/application/context/architecture/update/LocalUpdateArchitectureGateway.js";
import { IArchitectureUpdatedEventWriter } from "../../../../../../src/application/context/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../../../../../../src/application/context/architecture/update/IArchitectureUpdatedEventReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ArchitectureErrorMessages } from "../../../../../../src/domain/architecture/Constants.js";

const DEFINED_EVENT = {
  type: "ArchitectureDefinedEvent" as const,
  aggregateId: "architecture",
  version: 1,
  timestamp: "2025-01-01T00:00:00Z",
  payload: {
    description: "Original system",
    organization: "Clean Architecture",
    patterns: ["DDD"],
    principles: ["SRP"],
    dataStores: [],
    stack: ["TypeScript"],
  },
};

describe("LocalUpdateArchitectureGateway", () => {
  let gateway: LocalUpdateArchitectureGateway;
  let mockEventWriter: jest.Mocked<IArchitectureUpdatedEventWriter>;
  let mockEventReader: jest.Mocked<IArchitectureUpdatedEventReader>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn<IArchitectureUpdatedEventWriter["append"]>().mockResolvedValue({ nextSeq: 2 }),
    } as jest.Mocked<IArchitectureUpdatedEventWriter>;

    mockEventReader = {
      readStream: jest.fn<IArchitectureUpdatedEventReader["readStream"]>().mockResolvedValue([DEFINED_EVENT]),
    } as jest.Mocked<IArchitectureUpdatedEventReader>;

    mockEventBus = {
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
      subscribe: jest.fn<IEventBus["subscribe"]>(),
    } as jest.Mocked<IEventBus>;

    gateway = new LocalUpdateArchitectureGateway(mockEventWriter, mockEventReader, mockEventBus);
  });

  it("should update architecture and return architectureId", async () => {
    const response = await gateway.updateArchitecture({
      description: "Updated system",
      patterns: ["DDD", "CQRS"],
    });

    expect(response.architectureId).toBe("architecture");
    expect(mockEventReader.readStream).toHaveBeenCalledWith("architecture");
    expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it("should throw if architecture not defined", async () => {
    mockEventReader.readStream.mockResolvedValue([]);

    await expect(
      gateway.updateArchitecture({ description: "New description" })
    ).rejects.toThrow(ArchitectureErrorMessages.NOT_DEFINED);

    expect(mockEventWriter.append).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it("should parse data store strings into structured objects", async () => {
    await gateway.updateArchitecture({
      dataStores: ["postgres:relational:main-db"],
    });

    const appendedEvent = mockEventWriter.append.mock.calls[0][0] as unknown as {
      payload: { dataStores: Array<{ name: string; type: string; purpose: string }> };
    };
    expect(appendedEvent.payload.dataStores).toEqual([
      { name: "postgres", type: "relational", purpose: "main-db" },
    ]);
  });
});
