import {
  EntityType,
  EntityTypeValue,
  RelationAuditCheck,
  RelationAuditCheckValue,
} from "../../../../domain/relations/Constants.js";
import { RelationView } from "../RelationView.js";
import { AuditRelationsRequest } from "./AuditRelationsRequest.js";
import { RelationAuditResult } from "./RelationAuditResult.js";
import { RelationNodeCatalogEntry } from "./RelationNodeCatalogEntry.js";

const ALL_CHECKS = Object.values(RelationAuditCheck);

export class RelationAuditPolicy {
  audit(
    catalogEntries: readonly RelationNodeCatalogEntry[],
    relations: readonly RelationView[],
    request: AuditRelationsRequest,
  ): RelationAuditResult {
    const requestedChecks = this.normalizeChecks(request.checks);
    this.validateEntityType(request.entityType);

    const currentNodes = catalogEntries
      .filter((entry) => entry.isCurrent)
      .sort(this.compareNodes);
    const currentKeys = new Set(
      currentNodes.map((entry) =>
        this.nodeKey(entry.entityType, entry.entityId),
      ),
    );
    const orderedRelations = [...relations].sort((left, right) =>
      left.relationId.localeCompare(right.relationId),
    );
    const activeRelations = orderedRelations.filter(
      (relation) => relation.status === "active",
    );

    const danglingItems = activeRelations
      .map((relation) => {
        const from = {
          entityType: relation.fromEntityType,
          entityId: relation.fromEntityId,
        };
        const to = {
          entityType: relation.toEntityType,
          entityId: relation.toEntityId,
        };
        const missingEndpoints = [from, to].filter(
          (endpoint) =>
            !currentKeys.has(
              this.nodeKey(endpoint.entityType, endpoint.entityId),
            ),
        );
        return { relationId: relation.relationId, from, to, missingEndpoints };
      })
      .filter((finding) => finding.missingEndpoints.length > 0)
      .filter((finding) =>
        this.relationMatchesFilter(
          finding.from.entityType,
          finding.to.entityType,
          request.entityType,
        ),
      );

    const relationsByNode = new Map<string, RelationView[]>();
    for (const relation of orderedRelations) {
      this.appendRelation(
        relationsByNode,
        relation.fromEntityType,
        relation.fromEntityId,
        relation,
      );
      this.appendRelation(
        relationsByNode,
        relation.toEntityType,
        relation.toEntityId,
        relation,
      );
    }

    const filteredNodes = currentNodes.filter(
      (node) => !request.entityType || node.entityType === request.entityType,
    );
    const isolatedItems = filteredNodes
      .filter(
        (node) =>
          !(
            relationsByNode.get(this.nodeKey(node.entityType, node.entityId)) ??
            []
          ).some((relation) => relation.status === "active"),
      )
      .map((node) => ({
        entityType: node.entityType,
        entityId: node.entityId,
        lifecycleState: node.lifecycleState,
      }));

    const inactiveOnlyItems = filteredNodes
      .map((node) => ({
        node,
        relations:
          relationsByNode.get(this.nodeKey(node.entityType, node.entityId)) ??
          [],
      }))
      .filter(
        ({ relations: nodeRelations }) =>
          nodeRelations.length > 0 &&
          nodeRelations.every((relation) => relation.status !== "active"),
      )
      .map(({ node, relations: nodeRelations }) => ({
        entityType: node.entityType,
        entityId: node.entityId,
        lifecycleState: node.lifecycleState,
        relationIds: nodeRelations
          .map((relation) => relation.relationId)
          .sort(),
      }));

    const nodesById = new Map<string, Set<EntityTypeValue>>();
    for (const node of currentNodes) {
      const types = nodesById.get(node.entityId) ?? new Set<EntityTypeValue>();
      types.add(node.entityType);
      nodesById.set(node.entityId, types);
    }
    const ambiguousIdItems = [...nodesById.entries()]
      .map(([entityId, types]) => ({
        entityId,
        entityTypes: [...types].sort(),
      }))
      .filter((finding) => finding.entityTypes.length > 1)
      .filter(
        (finding) =>
          !request.entityType ||
          finding.entityTypes.includes(request.entityType),
      )
      .sort((left, right) => left.entityId.localeCompare(right.entityId));

    const summaryNodes = filteredNodes;
    const summaryRelations = orderedRelations.filter((relation) =>
      this.relationMatchesFilter(
        relation.fromEntityType,
        relation.toEntityType,
        request.entityType,
      ),
    );
    const summary = requestedChecks.includes(RelationAuditCheck.SUMMARY)
      ? {
          nodes: {
            count: summaryNodes.length,
            byEntityType: this.countBy(
              summaryNodes.map((node) => node.entityType),
            ),
          },
          relations: {
            count: summaryRelations.length,
            byRelationType: this.countBy(
              summaryRelations.map((relation) => relation.relationType),
            ),
            byStrength: this.countBy(
              summaryRelations.map(
                (relation) => relation.strength ?? "unspecified",
              ),
            ),
            byStatus: this.countBy(
              summaryRelations.map((relation) => relation.status),
            ),
          },
        }
      : {
          nodes: { count: 0, byEntityType: {} },
          relations: {
            count: 0,
            byRelationType: {},
            byStrength: {},
            byStatus: {},
          },
        };

    return {
      requestedChecks,
      entityType: request.entityType ?? null,
      summary,
      findings: {
        dangling: requestedChecks.includes(RelationAuditCheck.DANGLING)
          ? { count: danglingItems.length, items: danglingItems }
          : { count: 0, items: [] },
        isolated: requestedChecks.includes(RelationAuditCheck.ISOLATED)
          ? { count: isolatedItems.length, items: isolatedItems }
          : { count: 0, items: [] },
        inactiveOnly: requestedChecks.includes(RelationAuditCheck.INACTIVE_ONLY)
          ? { count: inactiveOnlyItems.length, items: inactiveOnlyItems }
          : { count: 0, items: [] },
        ambiguousId: requestedChecks.includes(RelationAuditCheck.AMBIGUOUS_ID)
          ? { count: ambiguousIdItems.length, items: ambiguousIdItems }
          : { count: 0, items: [] },
      },
    };
  }

  private normalizeChecks(
    checks: readonly RelationAuditCheckValue[] | undefined,
  ): RelationAuditCheckValue[] {
    if (!checks || checks.length === 0) return [...ALL_CHECKS];
    const invalid = checks.find((check) => !ALL_CHECKS.includes(check));
    if (invalid)
      throw new Error(`Audit check must be one of: ${ALL_CHECKS.join(", ")}.`);
    return ALL_CHECKS.filter((check) => checks.includes(check));
  }

  private validateEntityType(entityType: EntityTypeValue | undefined): void {
    if (entityType && !Object.values(EntityType).includes(entityType)) {
      throw new Error(
        `Entity type must be one of: ${Object.values(EntityType).join(", ")}.`,
      );
    }
  }

  private appendRelation(
    target: Map<string, RelationView[]>,
    entityType: EntityTypeValue,
    entityId: string,
    relation: RelationView,
  ): void {
    const key = this.nodeKey(entityType, entityId);
    const current = target.get(key) ?? [];
    if (!current.some((item) => item.relationId === relation.relationId))
      current.push(relation);
    target.set(key, current);
  }

  private relationMatchesFilter(
    fromEntityType: EntityTypeValue,
    toEntityType: EntityTypeValue,
    filter: EntityTypeValue | undefined,
  ): boolean {
    return !filter || fromEntityType === filter || toEntityType === filter;
  }

  private countBy(values: readonly string[]): Record<string, number> {
    return [...values]
      .sort()
      .reduce<Record<string, number>>((counts, value) => {
        counts[value] = (counts[value] ?? 0) + 1;
        return counts;
      }, {});
  }

  private nodeKey(entityType: EntityTypeValue, entityId: string): string {
    return `${entityType}\u0000${entityId}`;
  }

  private compareNodes(
    left: RelationNodeCatalogEntry,
    right: RelationNodeCatalogEntry,
  ): number {
    return (
      left.entityType.localeCompare(right.entityType) ||
      left.entityId.localeCompare(right.entityId)
    );
  }
}
