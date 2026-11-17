/**
 * Tests for relations.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { relationsList } from "../../../../../../../src/presentation/cli/commands/relations/list/relations.list.js";
import { GetRelationsController } from "../../../../../../../src/application/context/relations/get/GetRelationsController.js";
import { RelationView } from "../../../../../../../src/application/context/relations/RelationView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { RelationsListDependencies } from "../../../../../../../src/presentation/cli/commands/relations/list/relations.list.js";

describe("relations.list command", () => {
  let mockContainer: Partial<RelationsListDependencies>;
  let mockController: { handle: jest.Mock };
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getRelationsController: mockController as unknown as GetRelationsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all relations by default", async () => {
    const mockRelations: RelationView[] = [
      {
        relationId: "rel_123",
        fromEntityType: "goal",
        fromEntityId: "goal_456",
        toEntityType: "decision",
        toEntityId: "dec_789",
        relationType: "requires",
        strength: "strong",
        description: "Goal requires this decision",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ relations: mockRelations });

    await relationsList({}, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({
      entity: undefined,
      entityType: undefined,
      entityId: undefined,
      direction: undefined,
      relationType: undefined,
      relatedEntityType: undefined,
      strength: undefined,
      status: "active",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by entity type when specified", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList({ entityType: "goal" }, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "goal" })
    );
  });

  it("should filter by entity type and id when both specified", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList(
      { entityType: "component", entityId: "comp_123" },
      mockContainer as RelationsListDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "component", entityId: "comp_123" })
    );
  });

  it("should show info message when no relations exist", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList({}, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockRelations: RelationView[] = [
      {
        relationId: "rel_123",
        fromEntityType: "goal",
        fromEntityId: "goal_456",
        toEntityType: "decision",
        toEntityId: "dec_789",
        relationType: "requires",
        strength: null,
        description: "Test relation",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ relations: mockRelations });

    await relationsList({}, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList({ status: "all" }, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({ status: "all" })
    );
  });

  it("should support deactivated status filter", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList({ status: "deactivated" }, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({ status: "deactivated" })
    );
  });

  it("passes direction, relation, related entity, and strength filters", async () => {
    mockController.handle.mockResolvedValue({ relations: [] });

    await relationsList({
      entityType: "goal",
      entityId: "goal_1",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
    }, mockContainer as RelationsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith(expect.objectContaining({
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
    }));
  });
});
