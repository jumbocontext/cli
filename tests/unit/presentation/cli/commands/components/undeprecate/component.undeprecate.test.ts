import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { componentUndeprecate } from "../../../../../../../src/presentation/cli/commands/components/undeprecate/component.undeprecate.js";
import { UndeprecateComponentController } from "../../../../../../../src/application/context/components/undeprecate/UndeprecateComponentController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ComponentUndeprecateDependencies } from "../../../../../../../src/presentation/cli/commands/components/undeprecate/component.undeprecate.js";

describe("component.undeprecate command", () => {
  let mockContainer: Partial<ComponentUndeprecateDependencies>;
  let mockController: jest.Mocked<Pick<UndeprecateComponentController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<UndeprecateComponentController, "handle">>;

    mockContainer = {
      undeprecateComponentController: mockController as unknown as UndeprecateComponentController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("undeprecates a component via the controller", async () => {
    mockController.handle.mockResolvedValue({
      componentId: "comp_123",
      name: "LegacyService",
      status: "active",
      reason: "Still required",
    });

    await componentUndeprecate(
      { id: "comp_123", reason: "Still required" },
      mockContainer as ComponentUndeprecateDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      componentId: "comp_123",
      reason: "Still required",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("displays error and exits on failure", async () => {
    mockController.handle.mockRejectedValue(new Error("Removed components cannot be undeprecated"));

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await componentUndeprecate(
      { id: "comp_123", reason: "Still required" },
      mockContainer as ComponentUndeprecateDependencies
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
