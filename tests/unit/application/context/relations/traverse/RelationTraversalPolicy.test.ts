import { describe, expect, it } from "@jest/globals";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { RelationTraversalPolicy } from "../../../../../../src/application/context/relations/traverse/RelationTraversalPolicy.js";

const edge: RelationView = {
  relationId: "rel_b",
  fromEntityType: "goal",
  fromEntityId: "goal_1",
  toEntityType: "component",
  toEntityId: "component_1",
  relationType: "involves",
  strength: "strong",
  description: "Goal involves component",
  status: "active",
  version: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("RelationTraversalPolicy", () => {
  const policy = new RelationTraversalPolicy();

  it("selects adjacent typed nodes according to traversal direction", () => {
    expect(
      policy.relatedNode(
        { entityType: "goal", entityId: "goal_1" },
        edge,
        "out",
      ),
    ).toEqual({ entityType: "component", entityId: "component_1" });
    expect(
      policy.relatedNode(
        { entityType: "component", entityId: "component_1" },
        edge,
        "in",
      ),
    ).toEqual({ entityType: "goal", entityId: "goal_1" });
    expect(
      policy.relatedNode(
        { entityType: "goal", entityId: "goal_1" },
        edge,
        "in",
      ),
    ).toBeUndefined();
  });

  it("uses typed node identity and stable node ordering", () => {
    expect(policy.nodeKey({ entityType: "goal", entityId: "same" })).not.toBe(
      policy.nodeKey({ entityType: "component", entityId: "same" }),
    );
    expect(
      policy.compareNodes(
        { entityType: "component", entityId: "b" },
        { entityType: "goal", entityId: "a" },
      ),
    ).toBeLessThan(0);
  });

  it("orders equal-time relations by relation ID", () => {
    expect(
      policy.compareEdges({ ...edge, relationId: "rel_a" }, edge),
    ).toBeLessThan(0);
  });
});
