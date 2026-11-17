import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { InvariantView } from "../../../../../application/context/invariants/InvariantView.js";
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

export class InvariantListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(invariants: InvariantView[]): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Invariants (${invariants.length})`));

    for (let i = 0; i < invariants.length; i++) {
      const inv = invariants[i];
      if (i > 0) lines.push("");
      lines.push(contentLine(BrandColors.accentCyan(inv.title)));
      lines.push(...wrapContent(inv.description));
      lines.push(metaField("ID", Colors.muted(inv.invariantId), 4));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(invariants: InvariantView[]): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: invariants.length,
      invariants: invariants.map((i) => ({
        invariantId: i.invariantId,
        title: i.title,
        description: i.description,
        rationale: i.rationale,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list invariants")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
