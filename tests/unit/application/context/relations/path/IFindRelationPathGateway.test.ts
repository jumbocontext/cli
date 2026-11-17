import { describe, expect, it } from "@jest/globals";
import { IFindRelationPathGateway } from "../../../../../../src/application/context/relations/path/IFindRelationPathGateway.js";

describe("IFindRelationPathGateway", () => {
  it("defines a replaceable asynchronous shortest-path boundary", async () => {
    const gateway: IFindRelationPathGateway = {
      async findPath(request) {
        return {
          found: false,
          from: {
            entityType: request.fromEntityType ?? "goal",
            entityId: request.fromEntityId,
          },
          to: {
            entityType: request.toEntityType ?? "component",
            entityId: request.toEntityId,
          },
          hopCount: 0,
          nodes: [],
          edges: [],
          query: {
            maxDepth: request.maxDepth ?? 5,
            direction: "both",
            status: "active",
          },
        };
      },
    };

    await expect(
      gateway.findPath({ fromEntityId: "a", toEntityId: "b" }),
    ).resolves.toEqual(expect.objectContaining({ found: false }));
  });
});
