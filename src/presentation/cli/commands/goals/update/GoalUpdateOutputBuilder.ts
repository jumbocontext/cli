import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.update command output.
 * Encapsulates all output rendering for the update goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalUpdateOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal update.
   * Renders success message with goal ID.
   */
  buildSuccess(goalId: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Updated"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Goal has been updated")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({ goalId });
    return this.builder.build();
  }

  /**
   * Build output for goal update failure.
   * Renders error message when goal update fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to update goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
