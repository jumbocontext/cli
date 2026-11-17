import { describe, expect, it, jest } from "@jest/globals";
import { EntityTypeValue } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RelationListFilter } from "../../../../../../src/application/context/relations/get/RelationListFilter.js";
import { RelationNodeReference } from "../../../../../../src/application/context/relations/get/RelationNodeReference.js";
import { RelationShortestPathFinder } from "../../../../../../src/application/context/relations/path/RelationShortestPathFinder.js";
import { RelationTraversalQuery } from "../../../../../../src/application/context/relations/traverse/RelationTraversalQuery.js";

function relation(
  relationId: string,
  fromEntityType: EntityTypeValue,
  fromEntityId: string,
  toEntityType: EntityTypeValue,
  toEntityId: string,
  overrides: Partial<RelationView> = {},
): RelationView {
  return {
    relationId,
    fromEntityType,
    fromEntityId,
    toEntityType,
    toEntityId,
    relationType: "involves",
    strength: "strong",
    description: `Description for ${relationId}`,
    status: "active",
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function graphReader(edges: RelationView[]): IRelationViewReader {
  return {
    async findAll(filter?: RelationListFilter): Promise<RelationView[]> {
      const current = filter?.entity;
      return edges.filter((edge) => {
        if (!current) return true;
        const outgoing =
          edge.fromEntityType === current.entityType &&
          edge.fromEntityId === current.entityId;
        const incoming =
          edge.toEntityType === current.entityType &&
          edge.toEntityId === current.entityId;
        const directionMatches =
          filter.direction === "out"
            ? outgoing
            : filter.direction === "in"
              ? incoming
              : outgoing || incoming;
        const oppositeType = outgoing ? edge.toEntityType : edge.fromEntityType;
        return (
          directionMatches &&
          (!filter.relationType || edge.relationType === filter.relationType) &&
          (!filter.relatedEntityType ||
            oppositeType === filter.relatedEntityType) &&
          (!filter.strength || edge.strength === filter.strength) &&
          (filter.status === "all" ||
            edge.status === (filter.status ?? "active"))
        );
      });
    },
    async findEndpointTypes(): Promise<EntityTypeValue[]> {
      return [];
    },
  };
}

const from: RelationNodeReference = { entityType: "goal", entityId: "A" };
const to: RelationNodeReference = { entityType: "decision", entityId: "D" };

function query(
  overrides: Partial<RelationTraversalQuery> = {},
): RelationTraversalQuery {
  return { depth: 5, direction: "both", status: "active", ...overrides };
}

describe("RelationShortestPathFinder", () => {
  it("returns direct paths with original RelationView orientation and descriptions", async () => {
    const direct = relation("rel_direct", "goal", "A", "decision", "D");

    const result = await new RelationShortestPathFinder(
      graphReader([direct]),
    ).find(from, to, query({ direction: "out" }));

    expect(result).toMatchObject({ found: true, hopCount: 1 });
    expect(result.nodes).toEqual([from, to]);
    expect(result.edges).toEqual([
      expect.objectContaining({
        relationId: "rel_direct",
        fromEntityType: "goal",
        description: "Description for rel_direct",
      }),
    ]);
  });

  it("finds the shortest multi-hop path while handling cycles", async () => {
    const edges = [
      relation("rel_ab", "goal", "A", "component", "B"),
      relation("rel_bc", "component", "B", "component", "C"),
      relation("rel_ca", "component", "C", "goal", "A"),
      relation("rel_cd", "component", "C", "decision", "D"),
      relation("rel_long", "component", "B", "dependency", "E"),
      relation("rel_ed", "dependency", "E", "decision", "D"),
    ];

    const result = await new RelationShortestPathFinder(
      graphReader(edges),
    ).find(from, to, query({ direction: "out" }));

    expect(result.nodes.map((node) => node.entityId)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(result.edges.map((edge) => edge.relationId)).toEqual([
      "rel_ab",
      "rel_bc",
      "rel_cd",
    ]);
    expect(result.hopCount).toBe(3);
  });

  it("respects incoming, outgoing, and both directions", async () => {
    const edge = relation("rel", "goal", "A", "component", "B");
    const reverseFrom = { entityType: "component" as const, entityId: "B" };
    const reverseTo = { entityType: "goal" as const, entityId: "A" };
    const finder = new RelationShortestPathFinder(graphReader([edge]));

    await expect(
      finder.find(reverseFrom, reverseTo, query({ direction: "in" })),
    ).resolves.toEqual(expect.objectContaining({ found: true }));
    await expect(
      finder.find(reverseFrom, reverseTo, query({ direction: "out" })),
    ).resolves.toEqual(expect.objectContaining({ found: false }));
    await expect(
      finder.find(reverseFrom, reverseTo, query({ direction: "both" })),
    ).resolves.toEqual(expect.objectContaining({ found: true }));
  });

  it("forwards all canonical projection filters on every expansion", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>(),
    };

    await new RelationShortestPathFinder(reader).find(
      from,
      to,
      query({
        direction: "out",
        relationType: "requires",
        relatedEntityType: "component",
        strength: "weak",
        status: "deactivated",
      }),
    );

    expect(reader.findAll).toHaveBeenCalledWith({
      entity: from,
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "deactivated",
    });
  });

  it("returns empty path data for disconnected nodes and exhausted depth", async () => {
    const edges = [
      relation("rel_ab", "goal", "A", "component", "B"),
      relation("rel_bd", "component", "B", "decision", "D"),
    ];
    const finder = new RelationShortestPathFinder(graphReader(edges));

    const bounded = await finder.find(
      from,
      to,
      query({ depth: 1, direction: "out" }),
    );
    const disconnected = await new RelationShortestPathFinder(
      graphReader([]),
    ).find(from, to, query());

    expect(bounded).toMatchObject({
      found: false,
      hopCount: 0,
      nodes: [],
      edges: [],
    });
    expect(disconnected).toMatchObject({
      found: false,
      hopCount: 0,
      nodes: [],
      edges: [],
    });
  });

  it("selects equal-length paths by stable node ordering and parallel edges by relation order", async () => {
    const edges = [
      relation("rel_ac", "goal", "A", "component", "C", {
        createdAt: "2025-01-01",
      }),
      relation("rel_ab_b", "goal", "A", "component", "B"),
      relation("rel_ab_a", "goal", "A", "component", "B"),
      relation("rel_cd", "component", "C", "decision", "D"),
      relation("rel_bd", "component", "B", "decision", "D"),
    ];

    const result = await new RelationShortestPathFinder(
      graphReader(edges),
    ).find(from, to, query({ direction: "out" }));

    expect(result.nodes.map((node) => node.entityId)).toEqual(["A", "B", "D"]);
    expect(result.edges.map((edge) => edge.relationId)).toEqual([
      "rel_ab_a",
      "rel_bd",
    ]);
  });

  it("treats relation strength only as filter metadata, not path cost", async () => {
    const edges = [
      relation("weak_direct", "goal", "A", "decision", "D", {
        strength: "weak",
      }),
      relation("strong_1", "goal", "A", "component", "B", {
        strength: "strong",
      }),
      relation("strong_2", "component", "B", "decision", "D", {
        strength: "strong",
      }),
    ];

    const unfiltered = await new RelationShortestPathFinder(
      graphReader(edges),
    ).find(from, to, query({ direction: "out" }));
    const strongOnly = await new RelationShortestPathFinder(
      graphReader(edges),
    ).find(from, to, query({ direction: "out", strength: "strong" }));

    expect(unfiltered.edges.map((edge) => edge.relationId)).toEqual([
      "weak_direct",
    ]);
    expect(strongOnly.edges.map((edge) => edge.relationId)).toEqual([
      "strong_1",
      "strong_2",
    ]);
  });

  it("returns a zero-hop path when both typed endpoints are identical", async () => {
    const result = await new RelationShortestPathFinder(graphReader([])).find(
      from,
      from,
      query(),
    );

    expect(result).toMatchObject({
      found: true,
      hopCount: 0,
      nodes: [from],
      edges: [],
    });
  });
});
