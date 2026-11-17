/**
 * GuidelineSearchOutputBuilder - Presentation layer output builder
 * for the guidelines search command.
 *
 * Handles both TTY text and structured JSON output modes.
 * Supports default (full detail) and compact (id, category, title) formats.
 */

import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";
import { BrandColors, Colors } from "../../../rendering/StyleConfig.js";

export type GuidelineSearchOutputFormat = "default" | "compact";

export class GuidelineSearchOutputBuilder {
  private builder = new TerminalOutputBuilder();

  /**
   * Build output for TTY (human-readable formatted text).
   */
  build(
    guidelines: GuidelineView[],
    format: GuidelineSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (guidelines.length === 0) {
      this.builder.addPrompt(
        Colors.muted("No guidelines matched the search criteria."),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Guidelines (${guidelines.length})`));

    if (format === "compact") {
      for (const guideline of guidelines) {
        lines.push(
          contentLine(
            `${Colors.muted(guideline.guidelineId)}  ${Colors.dim(`[${guideline.category}]`)}  ${BrandColors.accentCyan(guideline.title)}`,
          ),
        );
      }
    } else {
      for (let i = 0; i < guidelines.length; i++) {
        const guideline = guidelines[i];
        if (i > 0) lines.push("");
        lines.push(
          contentLine(
            `${Colors.dim(`[${guideline.category.toUpperCase()}]`)} ${BrandColors.accentCyan(guideline.title)}`,
          ),
        );
        lines.push(...wrapContent(guideline.description));
        lines.push(
          metaField("Rationale", Colors.muted(guideline.rationale), 10),
        );
        if (guideline.examples.length > 0) {
          lines.push(
            metaField(
              "Examples",
              Colors.muted(guideline.examples.join(", ")),
              10,
            ),
          );
        }
        lines.push(metaField("ID", Colors.muted(guideline.guidelineId), 4));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   */
  buildStructuredOutput(
    guidelines: GuidelineView[],
    format: GuidelineSearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (format === "compact") {
      this.builder.addData({
        count: guidelines.length,
        guidelines: guidelines.map((guideline) => ({
          guidelineId: guideline.guidelineId,
          category: guideline.category,
          title: guideline.title,
        })),
      });
    } else {
      this.builder.addData({
        count: guidelines.length,
        guidelines: guidelines.map((guideline) => ({
          guidelineId: guideline.guidelineId,
          category: guideline.category,
          title: guideline.title,
          description: guideline.description,
          rationale: guideline.rationale,
          examples: guideline.examples,
          isRemoved: guideline.isRemoved,
          removedAt: guideline.removedAt,
          removalReason: guideline.removalReason,
          version: guideline.version,
          createdAt: guideline.createdAt,
          updatedAt: guideline.updatedAt,
        })),
      });
    }

    return this.builder.build();
  }
}
