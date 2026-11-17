import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import { RelationView } from "../../../../../application/context/relations/RelationView.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  metaField,
  contentLine,
  divider,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for component.show command output.
 * Encapsulates all output rendering for the show component command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class ComponentShowOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  private formatStatus(status: string): string {
    switch (status) {
      case "active":
        return "active";
      case "deprecated":
        return "deprecated";
      case "removed":
        return "removed";
      default:
        return status;
    }
  }

  /**
   * Build output for TTY (human-readable formatted text).
   */
  build(component: ComponentView, relations: RelationView[]): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Component"));
    lines.push(contentLine(Colors.primary(component.name)));

    lines.push("");
    lines.push(metaField("Id", Colors.muted(component.componentId), 16));
    lines.push(metaField("Type", Colors.primary(component.type), 16));
    lines.push(
      metaField(
        "Status",
        Colors.primary(this.formatStatus(component.status)),
        16,
      ),
    );
    lines.push(metaField("Path", Colors.muted(component.path), 16));
    lines.push(metaField("Created", Colors.muted(component.createdAt), 16));
    lines.push(metaField("Updated", Colors.muted(component.updatedAt), 16));

    if (component.deprecationReason) {
      lines.push(
        metaField(
          "Deprecation",
          Colors.warning(component.deprecationReason),
          16,
        ),
      );
    }

    lines.push("");
    lines.push(divider());
    lines.push("");

    lines.push(heading("Description"));
    lines.push(...wrapContent(component.description));

    if (component.responsibility) {
      lines.push("");
      lines.push(heading("Responsibility"));
      lines.push(...wrapContent(component.responsibility));
    }

    this.builder.addPrompt(lines.join("\n"));

    if (relations.length > 0) {
      const relLines: string[] = [];
      relLines.push(divider());
      relLines.push("");
      relLines.push(heading("Relations"));
      for (const relation of relations) {
        const direction =
          relation.fromEntityId === component.componentId
            ? `${Symbols.arrow} ${relation.toEntityType}:${relation.toEntityId}`
            : `${Symbols.arrow} ${relation.fromEntityType}:${relation.fromEntityId}`;
        const strength = relation.strength ? ` [${relation.strength}]` : "";
        relLines.push(
          contentLine(
            `${BrandColors.accentCyan(relation.relationType)}${strength} ${direction}`,
          ),
        );
        if (relation.description) {
          relLines.push(...wrapContent(relation.description));
        }
      }
      this.builder.addPrompt("\n\n" + relLines.join("\n"));
    } else {
      const relLines: string[] = [];
      relLines.push(divider());
      relLines.push("");
      relLines.push(heading("Relations"));
      relLines.push(contentLine(Colors.muted("No relations registered.")));
      this.builder.addPrompt("\n\n" + relLines.join("\n"));
    }

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   */
  buildStructuredOutput(
    component: ComponentView,
    relations: RelationView[],
  ): TerminalOutput {
    this.builder.reset();

    this.builder.addData({
      component: {
        componentId: component.componentId,
        name: component.name,
        type: component.type,
        status: component.status,
        description: component.description,
        responsibility: component.responsibility,
        path: component.path,
        deprecationReason: component.deprecationReason,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      },
      relations: relations.map((r) => ({
        relationId: r.relationId,
        fromEntityType: r.fromEntityType,
        fromEntityId: r.fromEntityId,
        toEntityType: r.toEntityType,
        toEntityId: r.toEntityId,
        relationType: r.relationType,
        strength: r.strength,
        description: r.description,
      })),
    });

    return this.builder.build();
  }

  /**
   * Build output for component not found error.
   */
  buildNotFoundError(identifier: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Component not found")}`,
    );
    this.builder.addData({
      message: `No component exists with ID or name: ${identifier}`,
    });
    return this.builder.build();
  }

  /**
   * Build output for component show failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to show component")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
