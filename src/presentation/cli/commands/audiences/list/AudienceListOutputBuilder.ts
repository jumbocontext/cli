import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { AudienceView } from "../../../../../application/context/audiences/AudienceView.js";
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

export class AudienceListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(audiences: AudienceView[], filter?: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Target Audiences (${audiences.length})`));

    for (let i = 0; i < audiences.length; i++) {
      const a = audiences[i];
      if (i > 0) lines.push("");
      const priorityTag = `[${a.priority.toUpperCase()}]`;
      lines.push(
        contentLine(
          `${Colors.bold(priorityTag)} ${BrandColors.accentCyan(a.name)}`,
        ),
      );
      lines.push(...wrapContent(a.description));
      lines.push(metaField("ID", Colors.muted(a.audienceId), 4));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    audiences: AudienceView[],
    filter?: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: audiences.length,
      audiences: audiences.map((a) => ({
        audienceId: a.audienceId,
        name: a.name,
        description: a.description,
        priority: a.priority,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list audiences")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
