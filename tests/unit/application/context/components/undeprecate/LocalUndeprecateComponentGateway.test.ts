import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUndeprecateComponentGateway } from "../../../../../../src/application/context/components/undeprecate/LocalUndeprecateComponentGateway.js";
import { UndeprecateComponentCommandHandler } from "../../../../../../src/application/context/components/undeprecate/UndeprecateComponentCommandHandler.js";
import { IComponentUndeprecateReader } from "../../../../../../src/application/context/components/undeprecate/IComponentUndeprecateReader.js";

describe("LocalUndeprecateComponentGateway", () => {
  let gateway: LocalUndeprecateComponentGateway;
  let commandHandler: jest.Mocked<Pick<UndeprecateComponentCommandHandler, "execute">>;
  let reader: jest.Mocked<IComponentUndeprecateReader>;

  beforeEach(() => {
    commandHandler = {
      execute: jest.fn(),
    } as jest.Mocked<Pick<UndeprecateComponentCommandHandler, "execute">>;

    reader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentUndeprecateReader>;

    gateway = new LocalUndeprecateComponentGateway(
      commandHandler as unknown as UndeprecateComponentCommandHandler,
      reader
    );
  });

  it("delegates command and maps response from view", async () => {
    commandHandler.execute.mockResolvedValue({ componentId: "comp_123" });
    reader.findById.mockResolvedValue({
      componentId: "comp_123",
      name: "LegacyService",
      type: "service",
      description: "desc",
      responsibility: "resp",
      path: "src/legacy.ts",
      status: "active",
      deprecationReason: null,
      version: 3,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z",
    });

    const response = await gateway.undeprecateComponent({
      componentId: "comp_123",
      reason: "Still required",
    });

    expect(commandHandler.execute).toHaveBeenCalledWith({
      componentId: "comp_123",
      reason: "Still required",
    });
    expect(response).toEqual({
      componentId: "comp_123",
      name: "LegacyService",
      status: "active",
      reason: "Still required",
    });
  });
});
