import { describe, expect, it } from "@jest/globals";
import { RelationTraversalResult } from "../../../../../../src/application/context/relations/traverse/RelationTraversalResult.js";

describe("RelationTraversalResult", () => {
  it("contains the root, graph collections, and traversal metadata", () => {
    const result: RelationTraversalResult = {
      root: { entityType: "goal", entityId: "goal_1" },
      nodes: [],
      edges: [],
      requestedDepth: 3,
      reachedDepth: 0,
      limit: 100,
      truncated: false,
    };

    expect(Object.keys(result)).toEqual([
      "root", "nodes", "edges", "requestedDepth", "reachedDepth", "limit", "truncated",
    ]);
  });
});
