import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { RelationView } from "../RelationView.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";
import { ITraverseRelationsGateway } from "./ITraverseRelationsGateway.js";
import { RelationNodeReferenceResolver } from "./RelationNodeReferenceResolver.js";
import { RelationTraversalNode } from "./RelationTraversalNode.js";
import { RelationTraversalPolicy } from "./RelationTraversalPolicy.js";
import { RelationTraversalQuery } from "./RelationTraversalQuery.js";
import { RelationTraversalQueryNormalizer } from "./RelationTraversalQueryNormalizer.js";
import { RelationTraversalResult } from "./RelationTraversalResult.js";
import { TraverseRelationsRequest } from "./TraverseRelationsRequest.js";

type NormalizedTraversalRequest = RelationTraversalQuery & {
  entityId: string;
  entityType?: EntityTypeValue;
  limit: number;
};

export class LocalTraverseRelationsGateway implements ITraverseRelationsGateway {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly nodeResolver = new RelationNodeReferenceResolver(
      relationViewReader,
    ),
    private readonly queryNormalizer = new RelationTraversalQueryNormalizer(),
    private readonly traversalPolicy = new RelationTraversalPolicy(),
  ) {}

  async traverse(
    request: TraverseRelationsRequest,
  ): Promise<RelationTraversalResult> {
    const normalized = this.normalize(request);
    const root = await this.resolveRoot(
      normalized.entityId,
      normalized.entityType,
    );
    const visited = new Set<string>([this.traversalPolicy.nodeKey(root)]);
    const nodes = new Map<string, RelationTraversalNode>();
    const edges = new Map<string, RelationView>();
    let frontier: RelationNodeReference[] = [root];
    let truncated = false;

    traversal: for (
      let distance = 1;
      distance <= normalized.depth && frontier.length > 0;
      distance++
    ) {
      const next = new Map<string, RelationNodeReference>();

      for (const current of [...frontier].sort((left, right) =>
        this.traversalPolicy.compareNodes(left, right),
      )) {
        const adjacent = await this.relationViewReader.findAll({
          entity: current,
          direction: normalized.direction,
          relationType: normalized.relationType,
          relatedEntityType: normalized.relatedEntityType,
          strength: normalized.strength,
          status: normalized.status,
        });

        for (const edge of [...adjacent].sort((left, right) =>
          this.traversalPolicy.compareEdges(left, right),
        )) {
          if (edges.has(edge.relationId)) continue;

          edges.set(edge.relationId, edge);
          const related = this.traversalPolicy.relatedNode(
            current,
            edge,
            normalized.direction,
          );
          if (related) {
            const relatedKey = this.traversalPolicy.nodeKey(related);
            if (!visited.has(relatedKey)) {
              visited.add(relatedKey);
              const traversalNode: RelationTraversalNode = {
                ...related,
                distance,
              };
              nodes.set(relatedKey, traversalNode);
              next.set(relatedKey, related);
            }
          }

          if (edges.size === normalized.limit) {
            truncated = true;
            break traversal;
          }
        }
      }

      frontier = [...next.values()];
    }

    const stableNodes = [...nodes.values()].sort(
      (left, right) =>
        left.distance - right.distance ||
        this.traversalPolicy.compareNodes(left, right),
    );
    const stableEdges = [...edges.values()].sort((left, right) =>
      this.traversalPolicy.compareEdges(left, right),
    );

    return {
      root,
      nodes: stableNodes,
      edges: stableEdges,
      requestedDepth: normalized.depth,
      reachedDepth: stableNodes.reduce(
        (maximum, node) => Math.max(maximum, node.distance),
        0,
      ),
      limit: normalized.limit,
      truncated,
    };
  }

  private normalize(
    request: TraverseRelationsRequest,
  ): NormalizedTraversalRequest {
    const entityId = request.entityId?.trim();
    if (!entityId) throw new Error("Entity ID must be provided.");

    const limit = request.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error("Limit must be an integer from 1 through 1000.");
    }
    const query = this.queryNormalizer.normalize(request);

    return {
      ...query,
      entityId,
      entityType: request.entityType,
      limit,
    };
  }

  private async resolveRoot(
    entityId: string,
    explicitType: EntityTypeValue | undefined,
  ): Promise<RelationNodeReference> {
    return this.nodeResolver.resolve(entityId, explicitType);
  }
}
