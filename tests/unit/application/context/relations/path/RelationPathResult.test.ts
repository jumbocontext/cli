import { describe, expect, it } from "@jest/globals";
import { RelationPathResult } from "../../../../../../src/application/context/relations/path/RelationPathResult.js";

describe("RelationPathResult", () => {
  it("contains stable endpoints, ordered path data, hop count, and query metadata", () => {
    const result: RelationPathResult = {
      found: false,
      from: { entityType: "goal", entityId: "goal_1" },
      to: { entityType: "component", entityId: "component_1" },
      hopCount: 0,
      nodes: [],
      edges: [],
      query: { maxDepth: 5, direction: "both", status: "active" },
    };

    expect(Object.keys(result)).toEqual([
      "found",
      "from",
      "to",
      "hopCount",
      "nodes",
      "edges",
      "query",
    ]);
  });
});
