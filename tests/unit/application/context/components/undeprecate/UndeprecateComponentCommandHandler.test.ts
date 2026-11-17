import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UndeprecateComponentCommandHandler } from "../../../../../../src/application/context/components/undeprecate/UndeprecateComponentCommandHandler.js";
import { IComponentUndeprecatedEventWriter } from "../../../../../../src/application/context/components/undeprecate/IComponentUndeprecatedEventWriter.js";
import { IComponentUndeprecateReader } from "../../../../../../src/application/context/components/undeprecate/IComponentUndeprecateReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ComponentEventType } from "../../../../../../src/domain/components/Constants.js";

describe("UndeprecateComponentCommandHandler", () => {
  let handler: UndeprecateComponentCommandHandler;
  let mockEventWriter: jest.Mocked<IComponentUndeprecatedEventWriter>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockReader: jest.Mocked<IComponentUndeprecateReader>;

  const componentId = "comp_test123";

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn<IComponentUndeprecatedEventWriter["append"]>().mockResolvedValue({ nextSeq: 1 }),
      readStream: jest.fn<IComponentUndeprecatedEventWriter["readStream"]>().mockResolvedValue([
        {
          type: ComponentEventType.ADDED,
          aggregateId: componentId,
          version: 1,
          timestamp: "2026-03-01T00:00:00.000Z",
          payload: {
            name: "LegacyService",
            type: "service",
            description: "A service",
            responsibility: "Serve",
            path: "src/service.ts",
            status: "active",
          },
        },
        {
          type: ComponentEventType.DEPRECATED,
          aggregateId: componentId,
          version: 2,
          timestamp: "2026-03-01T01:00:00.000Z",
          payload: {
            reason: "Deprecated",
            status: "deprecated",
          },
        },
      ]),
    } as jest.Mocked<IComponentUndeprecatedEventWriter>;

    mockEventBus = {
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as jest.Mocked<IEventBus>;

    mockReader = {
      findById: jest.fn<IComponentUndeprecateReader["findById"]>().mockResolvedValue({
        componentId,
        name: "LegacyService",
        type: "service",
        description: "A service",
        responsibility: "Serve",
        path: "src/service.ts",
        status: "deprecated",
        deprecationReason: "Deprecated",
        version: 2,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T01:00:00.000Z",
      }),
    } as jest.Mocked<IComponentUndeprecateReader>;

    handler = new UndeprecateComponentCommandHandler(mockEventWriter, mockEventBus, mockReader);
  });

  it("undeprecates component successfully and emits event", async () => {
    const result = await handler.execute({ componentId, reason: "Still required" });

    expect(result.componentId).toBe(componentId);
    expect(mockEventWriter.append).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ComponentEventType.UNDEPRECATED,
        aggregateId: componentId,
        payload: expect.objectContaining({ reason: "Still required" }),
      })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: ComponentEventType.UNDEPRECATED })
    );
  });

  it("throws when component does not exist", async () => {
    mockReader.findById.mockResolvedValue(null);

    await expect(handler.execute({ componentId, reason: "test" })).rejects.toThrow(
      `Component not found: ${componentId}`
    );
  });
});
