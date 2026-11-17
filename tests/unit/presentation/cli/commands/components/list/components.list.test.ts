/**
 * Tests for components.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { componentsList } from "../../../../../../../src/presentation/cli/commands/components/list/components.list.js";
import { GetComponentsController } from "../../../../../../../src/application/context/components/list/GetComponentsController.js";
import { ComponentView } from "../../../../../../../src/application/context/components/ComponentView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ComponentsListDependencies } from "../../../../../../../src/presentation/cli/commands/components/list/components.list.js";

describe("components.list command", () => {
  let mockContainer: Partial<ComponentsListDependencies>;
  let mockGetComponentsController: jest.Mocked<Pick<GetComponentsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockGetComponentsController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getComponentsController: mockGetComponentsController as unknown as GetComponentsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all components by default", async () => {
    const mockComponents: ComponentView[] = [
      {
        componentId: "comp_123",
        name: "UserService",
        type: "service",
        description: "Handles user operations",
        responsibility: "User management",
        path: "src/services/user",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGetComponentsController.handle.mockResolvedValue({ components: mockComponents });

    await componentsList({}, mockContainer as ComponentsListDependencies);

    expect(mockGetComponentsController.handle).toHaveBeenCalledWith({ status: "all" });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockGetComponentsController.handle.mockResolvedValue({ components: [] });

    await componentsList({ status: "active" }, mockContainer as ComponentsListDependencies);

    expect(mockGetComponentsController.handle).toHaveBeenCalledWith({ status: "active" });
  });

  it("should show info message when no components exist", async () => {
    mockGetComponentsController.handle.mockResolvedValue({ components: [] });

    await componentsList({}, mockContainer as ComponentsListDependencies);

    expect(mockGetComponentsController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockComponents: ComponentView[] = [
      {
        componentId: "comp_123",
        name: "TestComponent",
        type: "lib",
        description: "Test",
        responsibility: "Testing",
        path: "src/test",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGetComponentsController.handle.mockResolvedValue({ components: mockComponents });

    await componentsList({}, mockContainer as ComponentsListDependencies);

    expect(mockGetComponentsController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
