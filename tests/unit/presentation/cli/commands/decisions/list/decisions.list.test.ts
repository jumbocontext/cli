/**
 * Tests for decisions.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { decisionsList } from "../../../../../../../src/presentation/cli/commands/decisions/list/decisions.list.js";
import { GetDecisionsController } from "../../../../../../../src/application/context/decisions/get/GetDecisionsController.js";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { DecisionsListDependencies } from "../../../../../../../src/presentation/cli/commands/decisions/list/decisions.list.js";

describe("decisions.list command", () => {
  let mockContainer: Partial<DecisionsListDependencies>;
  let mockController: jest.Mocked<Pick<GetDecisionsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<GetDecisionsController, "handle">>;

    mockContainer = {
      getDecisionsController: mockController as unknown as GetDecisionsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all decisions by default", async () => {
    const mockDecisions: DecisionView[] = [
      {
        decisionId: "dec_123",
        title: "Use Event Sourcing",
        context: "Need to track all state changes",
        rationale: "Enables full audit trail",
        alternatives: ["CRUD"],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ decisions: mockDecisions });

    await decisionsList({}, mockContainer as DecisionsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ status: "all" });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockController.handle.mockResolvedValue({ decisions: [] });

    await decisionsList({ status: "active" }, mockContainer as DecisionsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ status: "active" });
  });

  it("should show info message when no decisions exist", async () => {
    mockController.handle.mockResolvedValue({ decisions: [] });

    await decisionsList({}, mockContainer as DecisionsListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockDecisions: DecisionView[] = [
      {
        decisionId: "dec_123",
        title: "Test Decision",
        context: "Test context",
        rationale: "Test rationale",
        alternatives: [],
        consequences: null,
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ decisions: mockDecisions });

    await decisionsList({}, mockContainer as DecisionsListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
