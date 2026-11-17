import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ContextualGoalView } from "../../../../../application/context/goals/get/ContextualGoalView.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
  wrapBulletContinuation,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.update-progress command output.
 * Encapsulates all output rendering for the update progress command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalUpdateProgressOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful progress update.
   * Renders success message and full progress list.
   */
  build(context: ContextualGoalView, addedTask: string): TerminalOutput {
    const goal = context.goal;
    const progress = goal.progress || [];
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Progress Updated"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Progress has been updated")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goal.goalId), 6));
    lines.push(metaField("Added", Colors.primary(addedTask), 6));
    lines.push(metaField("Total", Colors.primary(String(progress.length)), 6));

    if (progress.length > 0) {
      lines.push("");
      lines.push(heading("Progress"));
      for (const task of progress) {
        lines.push(...wrapBulletContinuation(task));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }
}
