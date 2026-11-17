import { describe, expect, it } from "@jest/globals";
import { RelationTraversalResult } from "../../../../../../../src/application/context/relations/traverse/RelationTraversalResult.js";
import { RelationTraverseOutputBuilder } from "../../../../../../../src/presentation/cli/commands/relations/traverse/RelationTraverseOutputBuilder.js";

const result: RelationTraversalResult = {
  root: { entityType: "goal", entityId: "goal_1" },
  nodes: [
    { entityType: "component", entityId: "component_1", distance: 1 },
    { entityType: "decision", entityId: "decision_1", distance: 2 },
  ],
  edges: [
    {
      relationId: "rel_1",
      fromEntityType: "goal",
      fromEntityId: "goal_1",
      toEntityType: "component",
      toEntityId: "component_1",
      relationType: "requires",
      strength: "strong",
      description: "first hop",
      status: "active",
      version: 1,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      relationId: "rel_2",
      fromEntityType: "decision",
      fromEntityId: "decision_1",
      toEntityType: "component",
      toEntityId: "component_1",
      relationType: "supports",
      strength: null,
      description: "second hop incoming edge",
      status: "active",
      version: 1,
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ],
  requestedDepth: 3,
  reachedDepth: 2,
  limit: 100,
  truncated: false,
};

describe("RelationTraverseOutputBuilder", () => {
  it("groups discoveries by hop and preserves directed arrows", () => {
    const text = new RelationTraverseOutputBuilder().build(result).toHumanReadable();

    expect(text).toContain("Hop 1");
    expect(text).toContain("Hop 2");
    expect(text).toContain("goal:goal_1 --[requires, strong]--> component:component_1");
    expect(text).toContain("decision:decision_1 --[supports]--> component:component_1");
  });

  it("returns the stable traversal JSON contract", () => {
    const output = new RelationTraverseOutputBuilder().buildStructuredOutput(result);
    const content = output.getSections().find((section) => section.type === "data")?.content;

    expect(content).toEqual({
      root: { entityType: "goal", entityId: "goal_1" },
      nodes: result.nodes,
      edges: [
        expect.objectContaining({ relationId: "rel_1", fromEntityType: "goal", toEntityType: "component" }),
        expect.objectContaining({ relationId: "rel_2", fromEntityType: "decision", toEntityType: "component" }),
      ],
      requestedDepth: 3,
      reachedDepth: 2,
      limit: 100,
      truncated: false,
    });
    expect(Object.keys(content as object)).toEqual([
      "root", "nodes", "edges", "requestedDepth", "reachedDepth", "limit", "truncated",
    ]);
  });
});
