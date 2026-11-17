import { describe, expect, it } from "@jest/globals";
import { FindRelationPathRequest } from "../../../../../../src/application/context/relations/path/FindRelationPathRequest.js";

describe("FindRelationPathRequest", () => {
  it("models typed or ID-only endpoints with bounded traversal filters", () => {
    const request: FindRelationPathRequest = {
      fromEntityId: "goal_1",
      fromEntityType: "goal",
      toEntityId: "component_1",
      maxDepth: 5,
      direction: "both",
      relationType: "involves",
      relatedEntityType: "component",
      strength: "strong",
      status: "active",
    };

    expect(request).toEqual(
      expect.objectContaining({
        fromEntityType: "goal",
        maxDepth: 5,
      }),
    );
  });
});
