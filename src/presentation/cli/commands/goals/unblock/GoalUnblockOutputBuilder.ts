import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.unblock command output.
 * Encapsulates all output rendering for the unblock goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalUnblockOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal unblock.
   * Renders success message with goal ID and optional resolution note.
   */
  buildSuccess(goalId: string, resolution?: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Goal Unblocked"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Goal has been unblocked")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goalId)));
    if (resolution) {
      lines.push(metaField("Resolution", Colors.primary(resolution)));
    }
    lines.push(
      metaField("Next", Colors.primary(`jumbo goal start --id ${goalId}`)),
    );
    this.builder.addPrompt(lines.join("\n"));
    const data: Record<string, string> = { goalId, status: "unblocked" };
    if (resolution) {
      data.resolution = resolution;
    }
    this.builder.addData(data);
    return this.builder.build();
  }

  /**
   * Build output for goal unblock failure.
   * Renders error message when goal unblock fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to unblock goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
