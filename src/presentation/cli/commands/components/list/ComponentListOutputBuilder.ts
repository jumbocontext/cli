import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

export class ComponentListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(components: ComponentView[], filter: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter === "all" ? "" : ` (${filter})`;
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Components${filterLabel} (${components.length})`));

    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      if (i > 0) lines.push("");
      lines.push(
        contentLine(
          `${BrandColors.accentCyan(c.name)} ${Colors.muted(`(${c.type})`)} ${Colors.dim(`[${c.status}]`)}`,
        ),
      );
      lines.push(...wrapContent(c.description));
      lines.push(metaField("Path", Colors.muted(c.path), 6));
      if (c.deprecationReason) {
        lines.push(metaField("Note", Colors.warning(c.deprecationReason), 6));
      }
      lines.push(metaField("ID", Colors.muted(c.componentId), 6));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    components: ComponentView[],
    filter: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: components.length,
      filter,
      components: components.map((c) => ({
        componentId: c.componentId,
        name: c.name,
        type: c.type,
        description: c.description,
        responsibility: c.responsibility,
        path: c.path,
        status: c.status,
        deprecationReason: c.deprecationReason,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list components")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
