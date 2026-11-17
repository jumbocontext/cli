import { describe, expect, it } from "@jest/globals";
import { ITraverseRelationsGateway } from "../../../../../../src/application/context/relations/traverse/ITraverseRelationsGateway.js";

describe("ITraverseRelationsGateway", () => {
  it("defines a replaceable asynchronous traversal boundary", async () => {
    const gateway: ITraverseRelationsGateway = {
      async traverse(request) {
        return {
          root: { entityType: request.entityType ?? "goal", entityId: request.entityId },
          nodes: [],
          edges: [],
          requestedDepth: request.depth ?? 1,
          reachedDepth: 0,
          limit: request.limit ?? 100,
          truncated: false,
        };
      },
    };

    await expect(gateway.traverse({ entityId: "goal_1" }))
      .resolves.toEqual(expect.objectContaining({ reachedDepth: 0 }));
  });
});
