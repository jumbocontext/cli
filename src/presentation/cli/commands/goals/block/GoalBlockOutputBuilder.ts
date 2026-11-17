import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.block command output.
 * Encapsulates all output rendering for the block goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalBlockOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal blocking.
   * Renders success message with goal ID and blocking reason.
   */
  buildSuccess(goalId: string, reason: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Blocked"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Goal has been blocked")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    lines.push(metaField("Reason", Colors.primary(reason)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({ goalId, reason });
    return this.builder.build();
  }

  /**
   * Build output for goal blocking failure.
   * Renders error message when goal blocking fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to block goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
