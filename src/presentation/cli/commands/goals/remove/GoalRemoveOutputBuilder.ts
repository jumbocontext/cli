import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.remove command output.
 * Encapsulates all output rendering for the remove goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalRemoveOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal removal.
   * Renders success message with goal ID and objective.
   */
  buildSuccess(goalId: string, objective: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Removed"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Goal has been removed")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    lines.push(metaField("Objective", Colors.primary(objective)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({ goalId, objective });
    return this.builder.build();
  }

  /**
   * Build output for goal removal failure.
   * Renders error message when goal removal fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to remove goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
