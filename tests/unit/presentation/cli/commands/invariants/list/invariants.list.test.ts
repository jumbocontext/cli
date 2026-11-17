/**
 * Tests for invariants.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { invariantsList } from "../../../../../../../src/presentation/cli/commands/invariants/list/invariants.list.js";
import { GetInvariantsController } from "../../../../../../../src/application/context/invariants/get/GetInvariantsController.js";
import { InvariantView } from "../../../../../../../src/application/context/invariants/InvariantView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { InvariantsListDependencies } from "../../../../../../../src/presentation/cli/commands/invariants/list/invariants.list.js";

describe("invariants.list command", () => {
  let mockContainer: Partial<InvariantsListDependencies>;
  let mockController: jest.Mocked<Pick<GetInvariantsController, "getAllInvariants">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      getAllInvariants: jest.fn(),
    };

    mockContainer = {
      getInvariantsController: mockController as unknown as GetInvariantsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all invariants", async () => {
    const mockInvariants: InvariantView[] = [
      {
        invariantId: "inv_123",
        title: "Single Responsibility",
        description: "Each class/module has one reason to change",
        rationale: "Reduces coupling",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.getAllInvariants.mockResolvedValue({ invariants: mockInvariants });

    await invariantsList({}, mockContainer as InvariantsListDependencies);

    expect(mockController.getAllInvariants).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no invariants exist", async () => {
    mockController.getAllInvariants.mockResolvedValue({ invariants: [] });

    await invariantsList({}, mockContainer as InvariantsListDependencies);

    expect(mockController.getAllInvariants).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockInvariants: InvariantView[] = [
      {
        invariantId: "inv_123",
        title: "Test Invariant",
        description: "Test description",
        rationale: "Test rationale",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.getAllInvariants.mockResolvedValue({ invariants: mockInvariants });

    await invariantsList({}, mockContainer as InvariantsListDependencies);

    expect(mockController.getAllInvariants).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
