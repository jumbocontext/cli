import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { SubmitGoalResponse } from "../../../../../application/context/goals/submit/SubmitGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.submit command output.
 * Encapsulates all output rendering for the submit goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalSubmitOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal submission.
   * Renders success message with next step to review the goal.
   */
  buildSuccess(
    response: SubmitGoalResponse,
    continueFlag: boolean = false,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Goal Submitted"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Implementation submitted for QA review")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(response.goalId), 11));
    lines.push(metaField("Objective", Colors.primary(response.objective), 11));
    lines.push(metaField("Status", Colors.primary(response.status), 11));

    this.builder.addPrompt(lines.join("\n"));

    if (continueFlag) {
      this.builder.addPrompt(
        "\n@LLM: Implementation submitted. The goal is now awaiting QA review.\n" +
          `Run: jumbo goal review --id ${response.goalId}`,
      );
    } else {
      this.builder.addPrompt(
        "\n" +
          `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To review: jumbo goal review --id ${response.goalId}`)}`,
      );
    }

    return this.builder.build();
  }

  /**
   * Build output for goal submit failure.
   * Renders error message when goal submission fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to submit goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
