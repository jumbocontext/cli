import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ValuePropositionView } from "../../../../../application/context/value-propositions/ValuePropositionView.js";
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

export class ValueListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(values: ValuePropositionView[]): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Value Propositions (${values.length})`));

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (i > 0) lines.push("");
      lines.push(contentLine(BrandColors.accentCyan(v.title)));
      lines.push(...wrapContent(v.description));
      if (v.benefit) {
        lines.push(metaField("Benefit", Colors.primary(v.benefit), 9));
      }
      if (v.measurableOutcome) {
        lines.push(
          metaField("Outcome", Colors.primary(v.measurableOutcome), 9),
        );
      }
      lines.push(metaField("ID", Colors.muted(v.valuePropositionId), 9));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(values: ValuePropositionView[]): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: values.length,
      valuePropositions: values.map((v) => ({
        valuePropositionId: v.valuePropositionId,
        title: v.title,
        description: v.description,
        benefit: v.benefit,
        measurableOutcome: v.measurableOutcome,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list value propositions")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
