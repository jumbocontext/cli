import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { RejectGoalResponse } from "../../../../../application/context/goals/reject/RejectGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  contentLine,
  metaField,
  divider,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.reject command output.
 * Encapsulates all output rendering for the reject goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalRejectOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal rejection.
   * Renders rejection result with review issues and next steps for the implementing agent.
   */
  buildSuccess(
    response: RejectGoalResponse,
    continueFlag: boolean = false,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Goal Rejected"));
    lines.push(
      contentLine(
        `${Symbols.cross} ${Colors.error("QA review failed — returned for rework")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(response.goalId), 11));
    lines.push(metaField("Objective", Colors.primary(response.objective), 11));
    lines.push(metaField("Status", Colors.primary(response.status), 11));

    if (response.nextGoalId) {
      lines.push(metaField("Next Goal", Colors.muted(response.nextGoalId), 11));
    }

    lines.push("");
    lines.push(divider());
    lines.push("");
    lines.push(heading("Review Issues"));
    lines.push(...wrapContent(response.reviewIssues));

    this.builder.addPrompt(lines.join("\n"));

    if (continueFlag) {
      this.builder.addPrompt(
        "\n@LLM: Address the review issues and restart the goal:\n" +
          `Run: jumbo goal start --id ${response.goalId}`,
      );
    } else {
      this.builder.addPrompt(
        "\n" +
          `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To restart: jumbo goal start --id ${response.goalId}`)}`,
      );
    }

    return this.builder.build();
  }

  /**
   * Build output for goal rejection failure.
   * Renders error message when goal rejection fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to reject goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
