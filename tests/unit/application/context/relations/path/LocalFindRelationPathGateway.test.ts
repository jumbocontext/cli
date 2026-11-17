import { describe, expect, it, jest } from "@jest/globals";
import { LocalFindRelationPathGateway } from "../../../../../../src/application/context/relations/path/LocalFindRelationPathGateway.js";
import { RelationPathResult } from "../../../../../../src/application/context/relations/path/RelationPathResult.js";
import { RelationShortestPathFinder } from "../../../../../../src/application/context/relations/path/RelationShortestPathFinder.js";
import { RelationNodeReferenceResolver } from "../../../../../../src/application/context/relations/traverse/RelationNodeReferenceResolver.js";
import { RelationTraversalQueryNormalizer } from "../../../../../../src/application/context/relations/traverse/RelationTraversalQueryNormalizer.js";

describe("LocalFindRelationPathGateway", () => {
  it("normalizes filters, resolves both endpoints, and delegates to shortest-path search", async () => {
    const query = {
      depth: 4,
      direction: "out" as const,
      status: "active" as const,
    };
    const from = { entityType: "goal" as const, entityId: "from" };
    const to = { entityType: "component" as const, entityId: "to" };
    const result: RelationPathResult = {
      found: false,
      from,
      to,
      hopCount: 0,
      nodes: [],
      edges: [],
      query: { maxDepth: 4, direction: "out", status: "active" },
    };
    const nodeResolver = {
      resolve: jest
        .fn<RelationNodeReferenceResolver["resolve"]>()
        .mockResolvedValueOnce(from)
        .mockResolvedValueOnce(to),
    } as unknown as RelationNodeReferenceResolver;
    const queryNormalizer = {
      normalize: jest
        .fn<RelationTraversalQueryNormalizer["normalize"]>()
        .mockReturnValue(query),
    } as unknown as RelationTraversalQueryNormalizer;
    const shortestPathFinder = {
      find: jest
        .fn<RelationShortestPathFinder["find"]>()
        .mockResolvedValue(result),
    } as unknown as RelationShortestPathFinder;

    const request = {
      fromEntityId: "from",
      toEntityId: "to",
      maxDepth: 4,
      direction: "out" as const,
    };
    const gateway = new LocalFindRelationPathGateway(
      nodeResolver,
      queryNormalizer,
      shortestPathFinder,
    );

    await expect(gateway.findPath(request)).resolves.toBe(result);
    expect(queryNormalizer.normalize).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 4,
        direction: "out",
      }),
      5,
    );
    expect(nodeResolver.resolve).toHaveBeenNthCalledWith(
      1,
      "from",
      undefined,
      "--from-type",
      "From entity",
    );
    expect(nodeResolver.resolve).toHaveBeenNthCalledWith(
      2,
      "to",
      undefined,
      "--to-type",
      "To entity",
    );
    expect(shortestPathFinder.find).toHaveBeenCalledWith(from, to, query);
  });

  it("reuses traversal validation for the maximum depth", async () => {
    const reader = {
      findAll: jest.fn().mockResolvedValue([]),
      findEndpointTypes: jest.fn().mockResolvedValue([]),
    };
    const resolver = new RelationNodeReferenceResolver(reader);
    const normalizer = new RelationTraversalQueryNormalizer();
    const finder = new RelationShortestPathFinder(reader);

    await expect(
      new LocalFindRelationPathGateway(resolver, normalizer, finder).findPath({
        fromEntityId: "from",
        fromEntityType: "goal",
        toEntityId: "to",
        toEntityType: "component",
        maxDepth: 6,
      }),
    ).rejects.toThrow("Depth must be an integer from 1 through 5");
  });
});
