import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { GoalPausedReasonsType } from "../../../../../domain/goals/GoalPausedReasons.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.pause command output.
 * Encapsulates all output rendering for the pause goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalPauseOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal pause.
   * Renders success message with goal details and pause reason.
   */
  buildSuccess(
    goalId: string,
    objective: string,
    status: string,
    reason: GoalPausedReasonsType,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Paused"));
    lines.push(
      contentLine(`${Symbols.check} ${Colors.success("Goal has been paused")}`),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    lines.push(metaField("Objective", Colors.primary(objective)));
    lines.push(metaField("Status", Colors.primary(status)));
    lines.push(metaField("Reason", Colors.primary(reason)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({ goalId, objective, status, reason });
    return this.builder.build();
  }

  /**
   * Build output for goal pause failure.
   * Renders error message when goal pause fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to pause goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
