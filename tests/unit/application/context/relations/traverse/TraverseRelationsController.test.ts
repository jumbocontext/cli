import { describe, expect, it, jest } from "@jest/globals";
import { ITraverseRelationsGateway } from "../../../../../../src/application/context/relations/traverse/ITraverseRelationsGateway.js";
import { TraverseRelationsController } from "../../../../../../src/application/context/relations/traverse/TraverseRelationsController.js";

describe("TraverseRelationsController", () => {
  it("delegates the typed traversal request and returns its result", async () => {
    const result = {
      root: { entityType: "goal" as const, entityId: "goal_1" },
      nodes: [],
      edges: [],
      requestedDepth: 1,
      reachedDepth: 0,
      limit: 100,
      truncated: false,
    };
    const gateway = {
      traverse: jest.fn<ITraverseRelationsGateway["traverse"]>().mockResolvedValue(result),
    };
    const request = { entityId: "goal_1", direction: "both" as const };

    await expect(new TraverseRelationsController(gateway).handle(request)).resolves.toBe(result);
    expect(gateway.traverse).toHaveBeenCalledWith(request);
  });
});
