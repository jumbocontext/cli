/**
 * Tests for values.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { valuesList } from "../../../../../../../src/presentation/cli/commands/value-propositions/list/values.list.js";
import { GetValuePropositionsController } from "../../../../../../../src/application/context/value-propositions/get/GetValuePropositionsController.js";
import { ValuePropositionView } from "../../../../../../../src/application/context/value-propositions/ValuePropositionView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ValuesListDependencies } from "../../../../../../../src/presentation/cli/commands/value-propositions/list/values.list.js";

describe("values.list command", () => {
  let mockContainer: Partial<ValuesListDependencies>;
  let mockController: jest.Mocked<Pick<GetValuePropositionsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getValuePropositionsController: mockController as unknown as GetValuePropositionsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list value propositions in text format", async () => {
    const mockValues: ValuePropositionView[] = [
      {
        valuePropositionId: "value_123",
        title: "Persistent Context",
        description: "Context that persists",
        benefit: "Never lose context",
        measurableOutcome: "100% retention",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ values: mockValues });

    await valuesList(mockContainer as ValuesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no values exist", async () => {
    mockController.handle.mockResolvedValue({ values: [] });

    await valuesList(mockContainer as ValuesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockValues: ValuePropositionView[] = [
      {
        valuePropositionId: "value_123",
        title: "Persistent Context",
        description: "Context that persists",
        benefit: "Never lose context",
        measurableOutcome: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ values: mockValues });

    await valuesList(mockContainer as ValuesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });
});
