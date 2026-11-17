import { describe, expect, it, jest } from "@jest/globals";
import { EntityTypeValue } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RelationListFilter } from "../../../../../../src/application/context/relations/get/RelationListFilter.js";
import { LocalTraverseRelationsGateway } from "../../../../../../src/application/context/relations/traverse/LocalTraverseRelationsGateway.js";

function relation(
  relationId: string,
  fromEntityType: EntityTypeValue,
  fromEntityId: string,
  toEntityType: EntityTypeValue,
  toEntityId: string,
  createdAt = `2026-01-01T00:00:${relationId.slice(-2).padStart(2, "0")}.000Z`
): RelationView {
  return {
    relationId,
    fromEntityType,
    fromEntityId,
    toEntityType,
    toEntityId,
    relationType: "involves",
    strength: "strong",
    description: relationId,
    status: "active",
    version: 1,
    createdAt,
    updatedAt: createdAt,
  };
}

function graphReader(edges: RelationView[]): IRelationViewReader {
  return {
    async findAll(filter?: RelationListFilter): Promise<RelationView[]> {
      const entityType = filter?.entity?.entityType ?? filter?.entityType;
      const entityId = filter?.entity?.entityId ?? filter?.entityId;
      return edges.filter((edge) => {
        const fromMatches = edge.fromEntityType === entityType && edge.fromEntityId === entityId;
        const toMatches = edge.toEntityType === entityType && edge.toEntityId === entityId;
        if (filter?.direction === "out") return fromMatches;
        if (filter?.direction === "in") return toMatches;
        return fromMatches || toMatches;
      });
    },
    async findEndpointTypes(entityId: string): Promise<EntityTypeValue[]> {
      return [...new Set(edges.flatMap((edge) => [
        ...(edge.fromEntityId === entityId ? [edge.fromEntityType] : []),
        ...(edge.toEntityId === entityId ? [edge.toEntityType] : []),
      ]))].sort();
    },
  };
}

describe("LocalTraverseRelationsGateway", () => {
  it("uses deterministic BFS, minimum distances, cycle prevention, and edge deduplication", async () => {
    const edges = [
      relation("rel_04", "component", "D", "decision", "C"),
      relation("rel_02", "component", "B", "decision", "C"),
      relation("rel_05", "decision", "C", "component", "B"),
      relation("rel_03", "goal", "A", "component", "D"),
      relation("rel_01", "goal", "A", "component", "B"),
    ];

    const result = await new LocalTraverseRelationsGateway(graphReader(edges)).traverse({
      entityType: "goal",
      entityId: "A",
      depth: 3,
    });

    expect(result.nodes).toEqual([
      { entityType: "component", entityId: "B", distance: 1 },
      { entityType: "component", entityId: "D", distance: 1 },
      { entityType: "decision", entityId: "C", distance: 2 },
    ]);
    expect(result.edges.map((edge) => edge.relationId)).toEqual([
      "rel_01", "rel_02", "rel_03", "rel_04", "rel_05",
    ]);
    expect(result.reachedDepth).toBe(2);
    expect(result.truncated).toBe(false);
  });

  it.each([
    ["out", ["outgoing"]],
    ["in", ["incoming"]],
    ["both", ["incoming", "outgoing"]],
  ] as const)("applies %s direction before expansion", async (direction, expectedIds) => {
    const edges = [
      relation("incoming", "goal", "A", "component", "B", "2026-01-01T00:00:01.000Z"),
      relation("outgoing", "component", "B", "decision", "C", "2026-01-01T00:00:02.000Z"),
    ];

    const result = await new LocalTraverseRelationsGateway(graphReader(edges)).traverse({
      entityType: "component",
      entityId: "B",
      direction,
    });

    expect(result.edges.map((edge) => edge.relationId)).toEqual(expectedIds);
  });

  it("forwards all filters on every frontier read", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>(),
    };

    await new LocalTraverseRelationsGateway(reader).traverse({
      entityType: "goal",
      entityId: "goal_1",
      depth: 2,
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "deactivated",
      limit: 17,
    });

    expect(reader.findAll).toHaveBeenCalledWith({
      entity: { entityType: "goal", entityId: "goal_1" },
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "deactivated",
    });
  });

  it("infers a unique endpoint type for ID-only input", async () => {
    const result = await new LocalTraverseRelationsGateway(graphReader([
      relation("rel_01", "goal", "shared", "component", "component_1"),
    ])).traverse({ entityId: "shared" });

    expect(result.root).toEqual({ entityType: "goal", entityId: "shared" });
  });

  it("reports every candidate when ID-only input is ambiguous", async () => {
    const gateway = new LocalTraverseRelationsGateway(graphReader([
      relation("rel_01", "goal", "shared", "component", "component_1"),
      relation("rel_02", "decision", "shared", "component", "component_2"),
    ]));

    await expect(gateway.traverse({ entityId: "shared" }))
      .rejects.toThrow("decision, goal");
  });

  it("requests an explicit type when no endpoint type can be inferred", async () => {
    const gateway = new LocalTraverseRelationsGateway(graphReader([]));

    await expect(gateway.traverse({ entityId: "unknown" }))
      .rejects.toThrow("Specify --entity-type explicitly");
  });

  it.each([0, 1.5, 6])("rejects invalid depth %s", async (depth) => {
    const gateway = new LocalTraverseRelationsGateway(graphReader([]));
    await expect(gateway.traverse({ entityType: "goal", entityId: "A", depth }))
      .rejects.toThrow("Depth must be an integer from 1 through 5");
  });

  it.each([0, 1.5, 1001])("rejects invalid limit %s", async (limit) => {
    const gateway = new LocalTraverseRelationsGateway(graphReader([]));
    await expect(gateway.traverse({ entityType: "goal", entityId: "A", limit }))
      .rejects.toThrow("Limit must be an integer from 1 through 1000");
  });

  it("returns deterministic partial results and marks truncation at the edge limit", async () => {
    const edges = [
      relation("rel_03", "goal", "A", "decision", "C"),
      relation("rel_01", "goal", "A", "component", "B"),
      relation("rel_02", "goal", "A", "dependency", "D"),
    ];

    const result = await new LocalTraverseRelationsGateway(graphReader(edges)).traverse({
      entityType: "goal",
      entityId: "A",
      limit: 2,
    });

    expect(result.edges.map((edge) => edge.relationId)).toEqual(["rel_01", "rel_02"]);
    expect(result.nodes).toEqual([
      { entityType: "component", entityId: "B", distance: 1 },
      { entityType: "dependency", entityId: "D", distance: 1 },
    ]);
    expect(result.truncated).toBe(true);
  });

  it("treats entity type plus entity ID as node identity", async () => {
    const edges = [
      relation("rel_01", "goal", "same", "component", "same"),
      relation("rel_02", "component", "same", "decision", "done"),
    ];

    const result = await new LocalTraverseRelationsGateway(graphReader(edges)).traverse({
      entityType: "goal",
      entityId: "same",
      depth: 2,
      direction: "out",
    });

    expect(result.nodes).toEqual([
      { entityType: "component", entityId: "same", distance: 1 },
      { entityType: "decision", entityId: "done", distance: 2 },
    ]);
  });

  it("uses the documented defaults", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>()
        .mockResolvedValue(["goal"]),
    };

    const result = await new LocalTraverseRelationsGateway(reader).traverse({ entityId: "A" });

    expect(result).toMatchObject({ requestedDepth: 1, limit: 100, truncated: false });
    expect(reader.findAll).toHaveBeenCalledWith(expect.objectContaining({
      entity: { entityType: "goal", entityId: "A" },
      direction: "both",
      status: "active",
    }));
  });
});
