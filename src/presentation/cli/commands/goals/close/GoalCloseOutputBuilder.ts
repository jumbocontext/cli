import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { CloseGoalResponse } from "../../../../../application/context/goals/close/CloseGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  EDGE,
  heading,
  contentLine,
  metaField,
  divider,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.close command output.
 * Encapsulates all output rendering for the close goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCloseOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal close.
   * Renders close confirmation and optional next goal information.
   */
  buildSuccess(
    response: CloseGoalResponse,
    continueFlag: boolean = false,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Goal Closed"));
    lines.push(
      contentLine(`${Symbols.check} ${Colors.success("Goal has been closed")}`),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(response.goalId), 11));
    lines.push(metaField("Objective", Colors.primary(response.objective), 11));
    lines.push(metaField("Status", Colors.primary(response.status), 11));

    if (response.nextGoal) {
      lines.push("");
      lines.push(divider());
      lines.push("");
      lines.push(heading("Next Goal"));
      lines.push(metaField("Id", Colors.muted(response.nextGoal.goalId), 11));
      lines.push(
        metaField("Objective", Colors.primary(response.nextGoal.objective), 11),
      );
      lines.push(
        metaField("Status", Colors.primary(response.nextGoal.status), 11),
      );

      this.builder.addPrompt(lines.join("\n"));
      this.builder.addData({
        goalId: response.nextGoal.goalId,
        objective: response.nextGoal.objective,
        status: response.nextGoal.status,
      });

      if (continueFlag) {
        this.builder.addPrompt(
          "\n@LLM: Start the next goal immediately.\n" +
            `Run: jumbo goal start --id ${response.nextGoal.goalId}`,
        );
      } else {
        this.builder.addPrompt(
          "\n" +
            `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To start: jumbo goal start --id ${response.nextGoal.goalId}`)}`,
        );
      }
    } else {
      this.builder.addPrompt(lines.join("\n"));
    }

    return this.builder.build();
  }

  /**
   * Build output for goal close failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to close goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
