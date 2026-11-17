import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";
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

export class GuidelineListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(guidelines: GuidelineView[], filter?: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter ? ` (${filter})` : "";
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Guidelines${filterLabel} (${guidelines.length})`));

    for (let i = 0; i < guidelines.length; i++) {
      const g = guidelines[i];
      if (i > 0) lines.push("");
      lines.push(
        contentLine(
          `${Colors.dim(`[${g.category.toUpperCase()}]`)} ${BrandColors.accentCyan(g.title)}`,
        ),
      );
      lines.push(...wrapContent(g.description));
      lines.push(metaField("ID", Colors.muted(g.guidelineId), 4));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    guidelines: GuidelineView[],
    filter?: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: guidelines.length,
      filter: filter ?? null,
      guidelines: guidelines.map((g) => ({
        guidelineId: g.guidelineId,
        category: g.category,
        title: g.title,
        description: g.description,
        rationale: g.rationale,
        examples: g.examples,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list guidelines")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
