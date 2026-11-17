/**
 * Tests for relation.add CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { relationAdd } from "../../../../../../../src/presentation/cli/commands/relations/add/relation.add.js";
import { AddRelationController } from "../../../../../../../src/application/context/relations/add/AddRelationController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { EntityType } from "../../../../../../../src/domain/relations/Constants.js";
import type { RelationAddDependencies } from "../../../../../../../src/presentation/cli/commands/relations/add/relation.add.js";

describe("relation.add command", () => {
  let mockContainer: Partial<RelationAddDependencies>;
  let mockController: jest.Mocked<Pick<AddRelationController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<AddRelationController, "handle">>;

    mockContainer = {
      addRelationController: mockController as unknown as AddRelationController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should add a relation via the controller", async () => {
    mockController.handle.mockResolvedValue({ relationId: "relation_abc" });

    await relationAdd(
      {
        fromType: "goal",
        fromId: "goal_123",
        toType: "component",
        toId: "comp_456",
        type: "involves",
        description: "Goal involves component",
      },
      mockContainer as RelationAddDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      fromEntityType: "goal",
      fromEntityId: "goal_123",
      toEntityType: "component",
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
      strength: undefined,
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should pass optional strength parameter", async () => {
    mockController.handle.mockResolvedValue({ relationId: "relation_abc" });

    await relationAdd(
      {
        fromType: "goal",
        fromId: "goal_123",
        toType: "invariant",
        toId: "inv_789",
        type: "must-respect",
        description: "Must respect invariant",
        strength: "strong",
      },
      mockContainer as RelationAddDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({ strength: "strong" })
    );
  });

  it("should display error and exit on failure", async () => {
    mockController.handle.mockRejectedValue(new Error("Duplicate relation"));

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await relationAdd(
      {
        fromType: "goal",
        fromId: "goal_123",
        toType: "component",
        toId: "comp_456",
        type: "involves",
        description: "Goal involves component",
      },
      mockContainer as RelationAddDependencies
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
