import { describe, expect, it } from "@jest/globals";
import { RelationTraversalNode } from "../../../../../../src/application/context/relations/traverse/RelationTraversalNode.js";

describe("RelationTraversalNode", () => {
  it("extends canonical node identity with minimum hop distance", () => {
    const node: RelationTraversalNode = { entityType: "component", entityId: "component_1", distance: 2 };
    expect(node.distance).toBe(2);
  });
});
