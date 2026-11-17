import chalk from "chalk";
import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";
import { SemanticColors, TuiGlyphs } from "../../../../shared/DesignTokens.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";

const decisionShowStyle = {
  heading: chalk.hex(SemanticColors.headline).bold,
  label: chalk.hex(SemanticColors.label),
  primary: chalk.hex(SemanticColors.primary),
  muted: chalk.hex(SemanticColors.muted),
  error: chalk.hex(SemanticColors.error),
} as const;

export class DecisionShowOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(decision: DecisionView): TerminalOutput {
    this.builder.reset();

    const lines = [
      "",
      `${decisionShowStyle.heading(TuiGlyphs.accentBar)} ${decisionShowStyle.heading("Architectural Decision")}`,
      this.field("ID", decision.decisionId),
      this.field("Title", decision.title),
      this.field("Status", decision.status),
      this.field("Context", decision.context),
      this.field("Rationale", decision.rationale),
      this.alternatives(decision.alternatives),
      this.field("Consequences", decision.consequences),
      this.field("Superseded by", decision.supersededBy),
      this.field("Reversal reason", decision.reversalReason),
      this.field("Reversed at", decision.reversedAt),
      this.field("Version", decision.version),
      this.field("Created at", decision.createdAt),
      this.field("Updated at", decision.updatedAt),
    ];

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(decision: DecisionView): TerminalOutput {
    this.builder.reset();
    this.builder.addData(decision);
    return this.builder.build();
  }

  buildNotFoundError(decisionId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${decisionShowStyle.error(TuiGlyphs.cross)} ${decisionShowStyle.error("Decision not found")}\n` +
        `${decisionShowStyle.muted(`No decision exists with ID: ${decisionId}`)}`,
    );
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    const details = error instanceof Error ? error.message : error;
    this.builder.addPrompt(
      `${decisionShowStyle.error(TuiGlyphs.cross)} ${decisionShowStyle.error("Failed to show decision")}\n` +
        decisionShowStyle.muted(details),
    );
    return this.builder.build();
  }

  private field(label: string, value: string | number | null): string {
    const rendered =
      value === null
        ? decisionShowStyle.muted("(null)")
        : value === ""
          ? decisionShowStyle.muted("(empty)")
          : decisionShowStyle.primary(String(value));

    return `${decisionShowStyle.label(`${label}:`)} ${rendered}`;
  }

  private alternatives(values: readonly string[]): string {
    const label = decisionShowStyle.label("Alternatives:");
    if (values.length === 0) {
      return `${label} ${decisionShowStyle.muted("(empty)")}`;
    }

    return `${label}\n${values
      .map(
        (value) =>
          `  ${decisionShowStyle.muted(TuiGlyphs.bullet)} ${decisionShowStyle.primary(value === "" ? "(empty)" : value)}`,
      )
      .join("\n")}`;
  }
}
