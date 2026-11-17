import { describe, expect, it } from "@jest/globals";
import { RelationTraversalQuery } from "../../../../../../src/application/context/relations/traverse/RelationTraversalQuery.js";

describe("RelationTraversalQuery", () => {
  it("models normalized traversal bounds and projection filters", () => {
    const query: RelationTraversalQuery = {
      depth: 5,
      direction: "both",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
      status: "all",
    };

    expect(query).toEqual(expect.objectContaining({ depth: 5, status: "all" }));
  });
});
