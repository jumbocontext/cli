import { describe, expect, it } from "@jest/globals";
import { RelationAuditPolicy } from "../../../../../../src/application/context/relations/audit/RelationAuditPolicy.js";
import { RelationNodeCatalogEntry } from "../../../../../../src/application/context/relations/audit/RelationNodeCatalogEntry.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";

const node = (
  entityType: RelationNodeCatalogEntry["entityType"],
  entityId: string,
  lifecycleState = "active",
  isCurrent = true,
): RelationNodeCatalogEntry => ({ entityType, entityId, lifecycleState, isCurrent });

const relation = (
  relationId: string,
  fromEntityType: RelationView["fromEntityType"],
  fromEntityId: string,
  toEntityType: RelationView["toEntityType"],
  toEntityId: string,
  status: RelationView["status"],
  relationType = "involves",
  strength: RelationView["strength"] = null,
): RelationView => ({
  relationId,
  fromEntityType,
  fromEntityId,
  toEntityType,
  toEntityId,
  relationType,
  strength,
  description: relationId,
  status,
  version: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

describe("RelationAuditPolicy", () => {
  const nodes = [
    node("goal", "g1"),
    node("goal", "shared"),
    node("component", "shared"),
    node("component", "old"),
    node("goal", "old-goal"),
    node("decision", "alone", "reversed"),
    node("dependency", "removed", "removed", false),
  ];
  const relations = [
    relation("rel-dangling", "goal", "g1", "component", "missing", "active", "involves", "strong"),
    relation("rel-active", "goal", "shared", "component", "shared", "active", "supports"),
    relation("rel-inactive", "component", "old", "goal", "old-goal", "deactivated", "supports", "weak"),
    relation("rel-removed", "component", "old", "goal", "old-goal", "removed", "requires", "weak"),
  ];

  it("finds every audit category and aggregates all relation dimensions", () => {
    const result = new RelationAuditPolicy().audit(nodes, relations, {});

    expect(result.requestedChecks).toEqual([
      "dangling", "isolated", "inactive-only", "ambiguous-id", "summary",
    ]);
    expect(result.findings.dangling).toEqual({
      count: 1,
      items: [expect.objectContaining({
        relationId: "rel-dangling",
        missingEndpoints: [{ entityType: "component", entityId: "missing" }],
      })],
    });
    expect(result.findings.isolated.items).toEqual([
      { entityType: "component", entityId: "old", lifecycleState: "active" },
      { entityType: "decision", entityId: "alone", lifecycleState: "reversed" },
      { entityType: "goal", entityId: "old-goal", lifecycleState: "active" },
    ]);
    expect(result.findings.inactiveOnly.items).toEqual([
      {
        entityType: "component",
        entityId: "old",
        lifecycleState: "active",
        relationIds: ["rel-inactive", "rel-removed"],
      },
      {
        entityType: "goal",
        entityId: "old-goal",
        lifecycleState: "active",
        relationIds: ["rel-inactive", "rel-removed"],
      },
    ]);
    expect(result.findings.ambiguousId.items).toEqual([
      { entityId: "shared", entityTypes: ["component", "goal"] },
    ]);
    expect(result.summary).toEqual({
      nodes: { count: 6, byEntityType: { component: 2, decision: 1, goal: 3 } },
      relations: {
        count: 4,
        byRelationType: { involves: 1, requires: 1, supports: 2 },
        byStrength: { strong: 1, unspecified: 1, weak: 2 },
        byStatus: { active: 2, deactivated: 1, removed: 1 },
      },
    });
  });

  it("selects, deduplicates, and stably orders checks while filtering by entity type", () => {
    const result = new RelationAuditPolicy().audit(nodes, relations, {
      checks: ["summary", "dangling", "summary"],
      entityType: "decision",
    });

    expect(result.requestedChecks).toEqual(["dangling", "summary"]);
    expect(result.entityType).toBe("decision");
    expect(result.summary.nodes).toEqual({ count: 1, byEntityType: { decision: 1 } });
    expect(result.summary.relations.count).toBe(0);
    expect(result.findings.dangling.count).toBe(0);
    expect(result.findings.isolated).toEqual({ count: 0, items: [] });
    expect(result.findings.ambiguousId.count).toBe(0);
  });

  it("rejects unknown checks and entity types", () => {
    const policy = new RelationAuditPolicy();
    expect(() => policy.audit([], [], { checks: ["cycles" as "summary"] })).toThrow(
      "Audit check must be one of",
    );
    expect(() => policy.audit([], [], { entityType: "unknown" as "goal" })).toThrow(
      "Entity type must be one of",
    );
  });

  it("keeps unrequested summary and finding collections empty", () => {
    const result = new RelationAuditPolicy().audit(nodes, relations, { checks: ["dangling"] });

    expect(result.summary).toEqual({
      nodes: { count: 0, byEntityType: {} },
      relations: { count: 0, byRelationType: {}, byStrength: {}, byStatus: {} },
    });
    expect(result.findings.dangling.count).toBe(1);
    expect(result.findings.isolated).toEqual({ count: 0, items: [] });
  });
});
