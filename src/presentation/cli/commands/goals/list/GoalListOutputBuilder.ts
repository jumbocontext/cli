import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalView } from '../../../../../application/context/goals/GoalView.js';
import { Colors, BrandColors, Symbols } from '../../../rendering/StyleConfig.js';
import { heading, contentLine, metaField, divider, wrapContent } from '../../../rendering/OutputLayout.js';

/**
 * Status ordering for goal list display.
 * Ordered reverse of the goal workflow: most progressed statuses appear first.
 * Includes ALL non-terminal GoalStatus values.
 */
export const STATUS_ORDER: Readonly<Record<string, number>> = {
  "approved": 0,
  "in-review": 1,
  "submitted": 2,
  "paused": 3,
  "doing": 4,
  "blocked": 5,
  "unblocked": 6,
  "rejected": 7,
  "in-refinement": 8,
  "codifying": 9,
  "refined": 10,
  "defined": 11,
  "postponed": 12
};

/**
 * Bracket-style heading labels for each status.
 */
const STATUS_HEADINGS: Readonly<Record<string, string>> = {
  "approved": "[APPROVED]",
  "in-review": "[IN-REVIEW]",
  "submitted": "[SUBMITTED]",
  "paused": "[PAUSED]",
  "doing": "[DOING]",
  "blocked": "[BLOCKED]",
  "unblocked": "[UNBLOCKED]",
  "rejected": "[REJECTED]",
  "in-refinement": "[IN-REFINEMENT]",
  "codifying": "[CODIFYING]",
  "refined": "[REFINED]",
  "defined": "[DEFINED]",
  "postponed": "[POSTPONED]"
};

/**
 * Specialized builder for goals.list command output.
 * Encapsulates all output rendering for the list goals command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalListOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for when no goals match the filter criteria.
   * Renders a custom message.
   */
  buildNoGoalsFound(message: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(message);
    return this.builder.build();
  }

  /**
   * @deprecated Use buildNoGoalsFound instead
   * Build output for when there are no active goals.
   * Renders a message indicating all goals are completed.
   */
  buildNoActiveGoals(): TerminalOutput {
    return this.buildNoGoalsFound("No active goals. All goals are completed.");
  }

  /**
   * Build output for active goals list.
   * Groups goals by status under heading lines, ordered by STATUS_ORDER.
   * Within each group, goals are sorted by createdAt ascending.
   * Empty groups are omitted.
   */
  buildActiveGoalsList(activeGoals: GoalView[]): TerminalOutput {
    this.builder.reset();

    // Group goals by status
    const groupedGoals = new Map<string, GoalView[]>();
    for (const goal of activeGoals) {
      const group = groupedGoals.get(goal.status) ?? [];
      group.push(goal);
      groupedGoals.set(goal.status, group);
    }

    // Sort within each group by createdAt ascending
    for (const group of groupedGoals.values()) {
      group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Get statuses ordered by STATUS_ORDER
    const orderedStatuses = [...groupedGoals.keys()].sort(
      (a, b) => (STATUS_ORDER[a] ?? 99) - (STATUS_ORDER[b] ?? 99)
    );

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Active Goals (${activeGoals.length})`));

    for (const status of orderedStatuses) {
      const goals = groupedGoals.get(status)!;
      const statusHeading = STATUS_HEADINGS[status] ?? `[${status.toUpperCase()}]`;
      lines.push("");
      lines.push(divider());
      lines.push(contentLine(Colors.bold(statusHeading)));
      lines.push("");

      for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        if (i > 0) lines.push("");
        if (goal.title) {
          lines.push(contentLine(BrandColors.accentCyan(goal.title)));
        }
        lines.push(...wrapContent(goal.objective));
        lines.push(metaField("Id", Colors.muted(goal.goalId), 6));
        if (goal.note) {
          lines.push(metaField("Note", Colors.primary(goal.note), 6));
        }
      }
    }

    const output = lines.join("\n");

    this.builder.addPrompt(output);
    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders list of goals as structured array.
   */
  buildStructuredOutput(activeGoals: GoalView[]): TerminalOutput {
    this.builder.reset();

    const sortedGoals = [...activeGoals].sort((a: GoalView, b: GoalView) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    this.builder.addData({
      goals: sortedGoals.map(goal => ({
        goalId: goal.goalId,
        title: goal.title,
        objective: goal.objective,
        status: goal.status,
        note: goal.note,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      })),
      count: sortedGoals.length
    });
    return this.builder.build();
  }

  /**
   * Build output for goals list failure.
   * Renders error message when listing goals fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.cross} ${Colors.error("Failed to list goals")}`);
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
