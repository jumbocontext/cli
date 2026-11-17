/**
 * DecisionSearchOutputBuilder - Presentation layer output builder
 * for the decisions search command.
 *
 * Handles both TTY text and structured JSON output modes.
 * Supports default (full detail) and compact (id, title, status) formats.
 */

import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";
import { BrandColors, Colors } from "../../../rendering/StyleConfig.js";

export type DecisionSearchOutputFormat = "default" | "compact";

export class DecisionSearchOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(
    decisions: DecisionView[],
    format: DecisionSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (decisions.length === 0) {
      this.builder.addPrompt(
        Colors.muted("No decisions matched the search criteria."),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Architectural Decisions (${decisions.length})`));

    if (format === "compact") {
      for (const d of decisions) {
        lines.push(
          contentLine(
            `${Colors.muted(d.decisionId)}  ${BrandColors.accentCyan(d.title)}  ${Colors.dim(`[${d.status}]`)}`,
          ),
        );
      }
    } else {
      for (let i = 0; i < decisions.length; i++) {
        const d = decisions[i];
        if (i > 0) lines.push("");
        lines.push(
          contentLine(
            `${BrandColors.accentCyan(d.title)} ${Colors.dim(`[${d.status}]`)}`,
          ),
        );
        if (d.context) {
          lines.push(...wrapContent(this.truncate(d.context)));
        }
        if (d.rationale) {
          lines.push(
            metaField(
              "Rationale",
              Colors.primary(this.truncate(d.rationale)),
              11,
            ),
          );
        }
        if (d.supersededBy) {
          lines.push(metaField("Superseded", Colors.muted(d.supersededBy), 11));
        }
        if (d.reversalReason) {
          lines.push(
            metaField(
              "Reversal",
              Colors.warning(this.truncate(d.reversalReason)),
              11,
            ),
          );
        }
        lines.push(metaField("ID", Colors.muted(d.decisionId), 11));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    decisions: DecisionView[],
    format: DecisionSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (format === "compact") {
      this.builder.addData({
        count: decisions.length,
        decisions: decisions.map((d) => ({
          decisionId: d.decisionId,
          title: d.title,
          status: d.status,
        })),
      });
    } else {
      this.builder.addData({
        count: decisions.length,
        decisions: decisions.map((d) => ({
          decisionId: d.decisionId,
          title: d.title,
          context: d.context,
          rationale: d.rationale,
          alternatives: d.alternatives,
          consequences: d.consequences,
          status: d.status,
          supersededBy: d.supersededBy,
          reversalReason: d.reversalReason,
          reversedAt: d.reversedAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      });
    }

    return this.builder.build();
  }

  private truncate(value: string): string {
    return value.length > 100 ? value.substring(0, 100) + "..." : value;
  }
}
