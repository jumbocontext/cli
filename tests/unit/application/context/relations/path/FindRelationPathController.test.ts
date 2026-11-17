import { describe, expect, it, jest } from "@jest/globals";
import { FindRelationPathController } from "../../../../../../src/application/context/relations/path/FindRelationPathController.js";
import { IFindRelationPathGateway } from "../../../../../../src/application/context/relations/path/IFindRelationPathGateway.js";

describe("FindRelationPathController", () => {
  it("delegates the complete path request and returns the gateway result", async () => {
    const result = {
      found: false,
      from: { entityType: "goal" as const, entityId: "a" },
      to: { entityType: "component" as const, entityId: "b" },
      hopCount: 0,
      nodes: [],
      edges: [],
      query: {
        maxDepth: 5,
        direction: "both" as const,
        status: "active" as const,
      },
    };
    const gateway = {
      findPath: jest
        .fn<IFindRelationPathGateway["findPath"]>()
        .mockResolvedValue(result),
    };
    const request = { fromEntityId: "a", toEntityId: "b" };

    await expect(
      new FindRelationPathController(gateway).handle(request),
    ).resolves.toBe(result);
    expect(gateway.findPath).toHaveBeenCalledWith(request);
  });
});
