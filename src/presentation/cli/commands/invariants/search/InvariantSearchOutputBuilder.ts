/**
 * InvariantSearchOutputBuilder - Presentation layer output builder
 * for the invariants search command.
 *
 * Handles both TTY text and structured JSON output modes.
 * Supports default (full detail) and compact (id, title) formats.
 */

import { InvariantView } from "../../../../../application/context/invariants/InvariantView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";
import { BrandColors, Colors } from "../../../rendering/StyleConfig.js";

export type InvariantSearchOutputFormat = "default" | "compact";

export class InvariantSearchOutputBuilder {
  private builder = new TerminalOutputBuilder();

  /**
   * Build output for TTY (human-readable formatted text).
   */
  build(
    invariants: InvariantView[],
    format: InvariantSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (invariants.length === 0) {
      this.builder.addPrompt(
        Colors.muted("No invariants matched the search criteria."),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Invariants (${invariants.length})`));

    if (format === "compact") {
      for (const invariant of invariants) {
        lines.push(
          contentLine(
            `${Colors.muted(invariant.invariantId)}  ${BrandColors.accentCyan(invariant.title)}`,
          ),
        );
      }
    } else {
      for (let i = 0; i < invariants.length; i++) {
        const invariant = invariants[i];
        if (i > 0) lines.push("");
        lines.push(contentLine(BrandColors.accentCyan(invariant.title)));
        lines.push(...wrapContent(invariant.description));
        if (invariant.rationale !== null) {
          lines.push(
            metaField("Rationale", Colors.muted(invariant.rationale), 10),
          );
        }
        lines.push(metaField("ID", Colors.muted(invariant.invariantId), 4));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   */
  buildStructuredOutput(
    invariants: InvariantView[],
    format: InvariantSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (format === "compact") {
      this.builder.addData({
        count: invariants.length,
        invariants: invariants.map((invariant) => ({
          invariantId: invariant.invariantId,
          title: invariant.title,
        })),
      });
    } else {
      this.builder.addData({
        count: invariants.length,
        invariants: invariants.map((invariant) => ({
          invariantId: invariant.invariantId,
          title: invariant.title,
          description: invariant.description,
          rationale: invariant.rationale,
          version: invariant.version,
          createdAt: invariant.createdAt,
          updatedAt: invariant.updatedAt,
        })),
      });
    }

    return this.builder.build();
  }
}
