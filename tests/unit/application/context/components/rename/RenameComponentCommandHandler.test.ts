import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RenameComponentCommandHandler } from "../../../../../../src/application/context/components/rename/RenameComponentCommandHandler.js";
import { IComponentRenamedEventWriter } from "../../../../../../src/application/context/components/rename/IComponentRenamedEventWriter.js";
import { IComponentRenameReader } from "../../../../../../src/application/context/components/rename/IComponentRenameReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ComponentEventType } from "../../../../../../src/domain/components/Constants.js";

describe("RenameComponentCommandHandler", () => {
  let handler: RenameComponentCommandHandler;
  let mockEventWriter: jest.Mocked<IComponentRenamedEventWriter>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockReader: jest.Mocked<IComponentRenameReader>;

  const componentId = "comp_test123";

  const addedEvent = {
    type: ComponentEventType.ADDED,
    aggregateId: componentId,
    version: 1,
    timestamp: "2025-11-09T10:00:00Z",
    payload: {
      name: "OldName",
      type: "service",
      description: "A description",
      responsibility: "A responsibility",
      path: "src/test.ts",
      status: "active",
    },
  };

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn<IComponentRenamedEventWriter["append"]>().mockResolvedValue({ nextSeq: 1 }),
      readStream: jest.fn<IComponentRenamedEventWriter["readStream"]>().mockResolvedValue([addedEvent]),
    } as jest.Mocked<IComponentRenamedEventWriter>;

    mockEventBus = {
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as jest.Mocked<IEventBus>;

    mockReader = {
      findById: jest.fn<IComponentRenameReader["findById"]>().mockResolvedValue({
        componentId,
        name: "OldName",
        type: "service",
        description: "A description",
        responsibility: "A responsibility",
        path: "src/test.ts",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-11-09T10:00:00Z",
        updatedAt: "2025-11-09T10:00:00Z",
      }),
    } as jest.Mocked<IComponentRenameReader>;

    handler = new RenameComponentCommandHandler(mockEventWriter, mockEventBus, mockReader);
  });

  it("should rename component successfully and emit event", async () => {
    const result = await handler.execute({ componentId, name: "NewName" });

    expect(result.componentId).toBe(componentId);
    expect(mockEventWriter.append).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ComponentEventType.RENAMED,
        aggregateId: componentId,
        payload: { name: "NewName" },
      })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ComponentEventType.RENAMED,
        payload: { name: "NewName" },
      })
    );
  });

  it("should throw when component does not exist", async () => {
    mockReader.findById.mockResolvedValue(null);

    await expect(handler.execute({ componentId, name: "NewName" })).rejects.toThrow(
      `Component not found: ${componentId}`
    );
  });

  it("should throw when renaming to the same name", async () => {
    await expect(handler.execute({ componentId, name: "OldName" })).rejects.toThrow(
      "New name must be different from the current name"
    );
  });

  it("should rehydrate aggregate from event history before renaming", async () => {
    await handler.execute({ componentId, name: "NewName" });

    expect(mockEventWriter.readStream).toHaveBeenCalledWith(componentId);
  });

  it("should persist the event before publishing", async () => {
    const callOrder: string[] = [];
    mockEventWriter.append.mockImplementation(async () => {
      callOrder.push("append");
      return { nextSeq: 1 };
    });
    mockEventBus.publish.mockImplementation(async () => {
      callOrder.push("publish");
    });

    await handler.execute({ componentId, name: "NewName" });

    expect(callOrder).toEqual(["append", "publish"]);
  });
});
