import chalk from "chalk";
import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";
import { SemanticColors, TuiGlyphs } from "../../../../shared/DesignTokens.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";

const guidelineShowStyle = {
  heading: chalk.hex(SemanticColors.headline).bold,
  label: chalk.hex(SemanticColors.label),
  primary: chalk.hex(SemanticColors.primary),
  muted: chalk.hex(SemanticColors.muted),
  error: chalk.hex(SemanticColors.error),
} as const;

export class GuidelineShowOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(guideline: GuidelineView): TerminalOutput {
    this.builder.reset();

    const lines = [
      "",
      `${guidelineShowStyle.heading(TuiGlyphs.accentBar)} ${guidelineShowStyle.heading("Execution Guideline")}`,
      this.field("ID", guideline.guidelineId),
      this.field("Category", guideline.category),
      this.field("Title", guideline.title),
      this.field("Description", guideline.description),
      this.field("Rationale", guideline.rationale),
      this.examples(guideline.examples),
      this.field("Removed", guideline.isRemoved),
      this.field("Removed at", guideline.removedAt),
      this.field("Removal reason", guideline.removalReason),
      this.field("Version", guideline.version),
      this.field("Created at", guideline.createdAt),
      this.field("Updated at", guideline.updatedAt),
    ];

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(guideline: GuidelineView): TerminalOutput {
    this.builder.reset();
    this.builder.addData(guideline);
    return this.builder.build();
  }

  buildNotFoundError(guidelineId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${guidelineShowStyle.error(TuiGlyphs.cross)} ${guidelineShowStyle.error("Guideline not found")}\n` +
      `${guidelineShowStyle.muted(`No guideline exists with ID: ${guidelineId}`)}`
    );
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    const details = error instanceof Error ? error.message : error;
    this.builder.addPrompt(
      `${guidelineShowStyle.error(TuiGlyphs.cross)} ${guidelineShowStyle.error("Failed to show guideline")}\n` +
      guidelineShowStyle.muted(details)
    );
    return this.builder.build();
  }

  private field(label: string, value: string | number | boolean | null): string {
    const rendered = value === null
      ? guidelineShowStyle.muted("(null)")
      : value === ""
        ? guidelineShowStyle.muted("(empty)")
        : guidelineShowStyle.primary(String(value));

    return `${guidelineShowStyle.label(`${label}:`)} ${rendered}`;
  }

  private examples(values: readonly string[]): string {
    const label = guidelineShowStyle.label("Examples:");
    if (values.length === 0) {
      return `${label} ${guidelineShowStyle.muted("(empty)")}`;
    }

    return `${label}\n${values
      .map((value) => `  ${guidelineShowStyle.muted(TuiGlyphs.bullet)} ${guidelineShowStyle.primary(value === "" ? "(empty)" : value)}`)
      .join("\n")}`;
  }
}
