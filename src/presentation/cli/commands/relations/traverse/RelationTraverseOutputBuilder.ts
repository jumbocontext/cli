import { RelationTraversalResult } from "../../../../../application/context/relations/traverse/RelationTraversalResult.js";
import { RelationView } from "../../../../../application/context/relations/RelationView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
} from "../../../rendering/OutputLayout.js";
import {
  BrandColors,
  Colors,
  Symbols,
} from "../../../rendering/StyleConfig.js";

export class RelationTraverseOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(result: RelationTraversalResult): TerminalOutput {
    this.builder.reset();
    const lines = [
      "",
      heading(
        `Relation traversal from ${this.nodeLabel(result.root.entityType, result.root.entityId)}`,
      ),
      metaField(
        "Depth",
        Colors.muted(`${result.reachedDepth}/${result.requestedDepth}`),
        11,
      ),
      metaField(
        "Edges",
        Colors.muted(`${result.edges.length}/${result.limit}`),
        11,
      ),
      metaField("Truncated", Colors.muted(String(result.truncated)), 11),
    ];

    if (result.edges.length === 0) {
      lines.push("");
      lines.push(
        contentLine(Colors.muted("No matching relations were found.")),
      );
    } else {
      const distances = new Map<string, number>([
        [this.nodeKey(result.root.entityType, result.root.entityId), 0],
        ...result.nodes.map(
          (node) =>
            [this.nodeKey(node.entityType, node.entityId), node.distance] as [
              string,
              number,
            ],
        ),
      ]);

      for (let hop = 1; hop <= result.reachedDepth; hop++) {
        const nodes = result.nodes.filter((node) => node.distance === hop);
        const edges = result.edges.filter(
          (edge) => this.edgeHop(edge, distances) === hop,
        );
        lines.push("");
        lines.push(heading(`Hop ${hop}`));
        for (const node of nodes) {
          lines.push(
            contentLine(
              BrandColors.accentCyan(
                this.nodeLabel(node.entityType, node.entityId),
              ),
            ),
          );
        }
        for (const edge of edges) {
          const strength = edge.strength ? `, ${edge.strength}` : "";
          lines.push(
            contentLine(
              `${this.nodeLabel(edge.fromEntityType, edge.fromEntityId)} ` +
                `--[${edge.relationType}${strength}]--> ` +
                this.nodeLabel(edge.toEntityType, edge.toEntityId),
            ),
          );
        }
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(result: RelationTraversalResult): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      root: { ...result.root },
      nodes: result.nodes.map((node) => ({ ...node })),
      edges: result.edges.map((edge) => this.edgeData(edge)),
      requestedDepth: result.requestedDepth,
      reachedDepth: result.reachedDepth,
      limit: result.limit,
      truncated: result.truncated,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    const message = error instanceof Error ? error.message : error;
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to traverse relations")}: ${message}`,
    );
    this.builder.addData({ error: "Failed to traverse relations", message });
    return this.builder.build();
  }

  private edgeData(edge: RelationView): Record<string, unknown> {
    return {
      relationId: edge.relationId,
      fromEntityType: edge.fromEntityType,
      fromEntityId: edge.fromEntityId,
      toEntityType: edge.toEntityType,
      toEntityId: edge.toEntityId,
      relationType: edge.relationType,
      strength: edge.strength,
      description: edge.description,
      status: edge.status,
      createdAt: edge.createdAt,
      updatedAt: edge.updatedAt,
    };
  }

  private edgeHop(edge: RelationView, distances: Map<string, number>): number {
    const fromDistance =
      distances.get(this.nodeKey(edge.fromEntityType, edge.fromEntityId)) ?? 0;
    const toDistance =
      distances.get(this.nodeKey(edge.toEntityType, edge.toEntityId)) ?? 0;
    return Math.max(fromDistance, toDistance, 1);
  }

  private nodeKey(entityType: string, entityId: string): string {
    return `${entityType}\u0000${entityId}`;
  }

  private nodeLabel(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
  }
}
