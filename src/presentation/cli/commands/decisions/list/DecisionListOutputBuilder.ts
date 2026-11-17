import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";
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

export class DecisionListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(decisions: DecisionView[], filter: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter === "all" ? "" : ` (${filter})`;
    const lines: string[] = [];

    lines.push("");
    lines.push(
      heading(`Architectural Decisions${filterLabel} (${decisions.length})`),
    );

    for (let i = 0; i < decisions.length; i++) {
      const d = decisions[i];
      if (i > 0) lines.push("");
      lines.push(
        contentLine(
          `${BrandColors.accentCyan(d.title)} ${Colors.dim(`[${d.status}]`)}`,
        ),
      );
      if (d.context) {
        const truncated =
          d.context.length > 100
            ? d.context.substring(0, 100) + "..."
            : d.context;
        lines.push(...wrapContent(truncated));
      }
      if (d.rationale) {
        const truncated =
          d.rationale.length > 100
            ? d.rationale.substring(0, 100) + "..."
            : d.rationale;
        lines.push(metaField("Rationale", Colors.primary(truncated), 11));
      }
      if (d.supersededBy) {
        lines.push(metaField("Superseded", Colors.muted(d.supersededBy), 11));
      }
      if (d.reversalReason) {
        lines.push(metaField("Reversal", Colors.warning(d.reversalReason), 11));
      }
      lines.push(metaField("ID", Colors.muted(d.decisionId), 11));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    decisions: DecisionView[],
    filter: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: decisions.length,
      filter,
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
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list decisions")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
