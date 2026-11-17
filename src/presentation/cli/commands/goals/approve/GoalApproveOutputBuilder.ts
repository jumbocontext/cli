import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { QualifyGoalResponse } from "../../../../../application/context/goals/qualify/QualifyGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  contentLine,
  metaField,
  divider,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.approve command output.
 * Encapsulates all output rendering for the approve goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalApproveOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal approval.
   * Renders approval result with next steps.
   */
  buildSuccess(
    response: QualifyGoalResponse,
    continueFlag: boolean = false,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Goal Approved"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("QA review passed — ready for codification")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(response.goalId), 11));
    lines.push(metaField("Objective", Colors.primary(response.objective), 11));
    lines.push(metaField("Status", Colors.primary(response.status), 11));

    if (response.nextGoalId) {
      lines.push(metaField("Next Goal", Colors.muted(response.nextGoalId), 11));
    }

    this.builder.addPrompt(lines.join("\n"));

    if (continueFlag) {
      this.builder.addPrompt(
        "\n@LLM: Goal approved. Codify the goal:\n" +
          `Run: jumbo goal codify --id ${response.goalId}`,
      );
    } else {
      this.builder.addPrompt(
        "\n" +
          `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To codify: jumbo goal codify --id ${response.goalId}`)}`,
      );
    }

    return this.builder.build();
  }

  /**
   * Build output for goal approval failure.
   * Renders error message when goal approval fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to approve goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
