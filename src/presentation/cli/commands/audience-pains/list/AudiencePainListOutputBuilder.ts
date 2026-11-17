import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { AudiencePainView } from "../../../../../application/context/audience-pains/AudiencePainView.js";
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

export class AudiencePainListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(pains: AudiencePainView[]): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Audience Pains (${pains.length})`));

    for (let i = 0; i < pains.length; i++) {
      const p = pains[i];
      if (i > 0) lines.push("");
      lines.push(
        contentLine(
          `${Colors.dim(`[${p.status.toUpperCase()}]`)} ${BrandColors.accentCyan(p.title)}`,
        ),
      );
      lines.push(...wrapContent(p.description));
      lines.push(metaField("ID", Colors.muted(p.painId), 4));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(pains: AudiencePainView[]): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: pains.length,
      pains: pains.map((p) => ({
        painId: p.painId,
        title: p.title,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list audience pains")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
