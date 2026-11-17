/**
 * ComponentSearchOutputBuilder - Presentation layer output builder
 * for the components search command.
 *
 * Handles both TTY text and structured JSON output modes.
 * Supports default (full detail) and compact (id, name, type) formats.
 */

import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import { Colors, BrandColors } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
  divider,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

export type SearchOutputFormat = "default" | "compact";

export class ComponentSearchOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for TTY (human-readable formatted text).
   */
  build(
    components: ComponentView[],
    format: SearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (components.length === 0) {
      this.builder.addPrompt(
        Colors.muted("No components matched the search criteria."),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Components (${components.length})`));

    if (format === "compact") {
      for (const c of components) {
        lines.push(
          contentLine(
            `${Colors.muted(c.componentId)}  ${BrandColors.accentCyan(c.name)}  ${Colors.muted(`(${c.type})`)}`,
          ),
        );
      }
    } else {
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
        lines.push(metaField("ID", Colors.muted(c.componentId), 6));
      }
    }

    this.builder.addPrompt(lines.join("\n"));

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   */
  buildStructuredOutput(
    components: ComponentView[],
    format: SearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (format === "compact") {
      this.builder.addData({
        count: components.length,
        components: components.map((c) => ({
          componentId: c.componentId,
          name: c.name,
          type: c.type,
        })),
      });
    } else {
      this.builder.addData({
        count: components.length,
        components: components.map((c) => ({
          componentId: c.componentId,
          name: c.name,
          type: c.type,
          description: c.description,
          responsibility: c.responsibility,
          path: c.path,
          status: c.status,
          deprecationReason: c.deprecationReason,
        })),
      });
    }

    return this.builder.build();
  }
}
