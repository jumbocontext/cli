import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.commit command output.
 * Encapsulates all output rendering for the commit goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCommitOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal commit.
   * Renders success message with next step to start the goal.
   */
  buildSuccess(
    goalId: string,
    status: string,
    continueFlag: boolean = false,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Committed"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Goal refinement committed")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    lines.push(metaField("Status", Colors.primary(status)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({ goalId, status });

    if (continueFlag) {
      this.builder.addPrompt(
        "\n@LLM: Goal refinement is committed and ready to start.\n" +
          `Run: jumbo goal start --id ${goalId}`,
      );
    } else {
      this.builder.addPrompt(
        "\n" +
          `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To start: jumbo goal start --id ${goalId}`)}`,
      );
    }

    return this.builder.build();
  }

  /**
   * Build output for goal not found error.
   * Renders error message when goal doesn't exist.
   */
  buildGoalNotFoundError(goalId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Goal not found")}`,
    );
    this.builder.addData({ message: `No goal exists with ID: ${goalId}` });
    return this.builder.build();
  }

  /**
   * Build output for goal commit failure.
   * Renders error message when goal commit fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to commit goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
