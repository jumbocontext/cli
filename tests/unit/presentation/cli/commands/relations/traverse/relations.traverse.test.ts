import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { TraverseRelationsController } from "../../../../../../../src/application/context/relations/traverse/TraverseRelationsController.js";
import { relationsTraverse } from "../../../../../../../src/presentation/cli/commands/relations/traverse/relations.traverse.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { RelationsTraverseDependencies } from "../../../../../../../src/presentation/cli/commands/relations/traverse/relations.traverse.js";

describe("relations.traverse command", () => {
  let handle: jest.Mock;
  let container: Partial<RelationsTraverseDependencies>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    handle = jest.fn().mockResolvedValue({
      root: { entityType: "goal", entityId: "goal_1" },
      nodes: [],
      edges: [],
      requestedDepth: 1,
      reachedDepth: 0,
      limit: 100,
      truncated: false,
    });
    container = {
      traverseRelationsController: { handle } as unknown as TraverseRelationsController,
    };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("uses traversal defaults", async () => {
    await relationsTraverse({ id: "goal_1" }, container as RelationsTraverseDependencies);

    expect(handle).toHaveBeenCalledWith({
      entityId: "goal_1",
      entityType: undefined,
      depth: 1,
      direction: "both",
      relationType: undefined,
      relatedEntityType: undefined,
      strength: undefined,
      status: "active",
      limit: 100,
    });
  });

  it("parses and passes every CLI filter", async () => {
    await relationsTraverse({
      id: "goal_1",
      entityType: "goal",
      depth: "5",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "all",
      limit: "1000",
    }, container as RelationsTraverseDependencies);

    expect(handle).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "goal",
      depth: 5,
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "all",
      limit: 1000,
    }));
  });

  it("emits one structured result in JSON mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await relationsTraverse({ id: "goal_1" }, container as RelationsTraverseDependencies);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(() => JSON.parse(String(consoleSpy.mock.calls[0][0]))).not.toThrow();
  });
});
