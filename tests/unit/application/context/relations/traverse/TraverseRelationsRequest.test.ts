import { describe, expect, it } from "@jest/globals";
import { TraverseRelationsRequest } from "../../../../../../src/application/context/relations/traverse/TraverseRelationsRequest.js";

describe("TraverseRelationsRequest", () => {
  it("models typed root, bounds, direction, and edge filters", () => {
    const request: TraverseRelationsRequest = {
      entityId: "goal_1",
      entityType: "goal",
      depth: 5,
      direction: "both",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "all",
      limit: 1000,
    };

    expect(request).toEqual(expect.objectContaining({ depth: 5, limit: 1000 }));
  });
});
