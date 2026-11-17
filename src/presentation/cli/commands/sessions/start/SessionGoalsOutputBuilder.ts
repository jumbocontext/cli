import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { GoalView } from "../../../../../application/context/goals/GoalView.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";

/**
 * Status ordering for session start goal display.
 * Ordered reverse of the goal workflow: most progressed statuses appear first.
 * Matches GoalListOutputBuilder's STATUS_ORDER.
 */
const STATUS_ORDER: Readonly<Record<string, number>> = {
  approved: 0,
  "in-review": 1,
  submitted: 2,
  paused: 3,
  doing: 4,
  blocked: 5,
  unblocked: 6,
  rejected: 7,
  "in-refinement": 8,
  codifying: 9,
  refined: 10,
  defined: 11,
};

/**
 * Next-step hints per goal status.
 */
const STATUS_HINTS: Readonly<Record<string, string>> = {
  defined: "jumbo goal refine --id <id>",
  refined: "jumbo goal start --id <id>",
  doing: "jumbo goal submit --id <id>",
  paused: "jumbo goal resume --id <id>",
  blocked: "jumbo goal unblock --id <id>",
  unblocked: "jumbo goal start --id <id>",
  "in-review": "Awaiting QA review",
  approved: "jumbo goal codify --id <id>",
  rejected: "jumbo goal start --id <id>",
  submitted: "jumbo goal review --id <id>",
  "in-refinement": "Awaiting refinement completion",
  codifying: "Awaiting codification completion",
};

interface GoalGroupEntry {
  goalId: string;
  objective: string;
  createdAt: string;
}

interface GoalGroup {
  hint: string;
  count: number;
  goals: GoalGroupEntry[];
}

export type GroupedGoals = Record<string, GoalGroup>;

/**
 * SessionGoalsOutputBuilder - Builds output for session start goal sections.
 *
 * Groups all goals by status with per-state next-step hints.
 * Includes the @LLM goal start instruction prompt.
 */
export class SessionGoalsOutputBuilder {
  private readonly builder: TerminalOutputBuilder;
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.builder = new TerminalOutputBuilder();
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Build human-readable goals output for session start.
   * Groups goals by status with hints, ordered by STATUS_ORDER.
   * Empty groups are omitted.
   */
  buildGoalsOutput(allGoals: GoalView[]): TerminalOutput {
    this.builder.reset();

    const grouped = this.buildGroupedGoals(allGoals);
    this.builder.addPrompt(this.yamlFormatter.toYaml({ goals: grouped }));
    this.builder.addPrompt("---\n");
    this.builder.addPrompt(this.renderGoalStartInstruction());

    return this.builder.build();
  }

  /**
   * Build structured goals data for JSON output.
   */
  buildStructuredGoals(allGoals: GoalView[]): {
    goals: GroupedGoals;
    llmGoalStartInstruction: string;
  } {
    return {
      goals: this.buildGroupedGoals(allGoals),
      llmGoalStartInstruction: this.renderGoalStartInstruction(),
    };
  }

  renderGoalStartInstruction(): string {
    const llmInstruction = [
      "@LLM: Prompt the user for input about what goal to work on. ",
      "For example, \"I can see we've recently worked on X, Y, Z. ",
      "Everything was completed without blockers. Goals A, B, and N ",
      'are available. Do you want to start with A, or something else?"',
      "Each goal group includes a hint with the suggested next-step command.",
      "IMPORTANT: Run the suggested command for the chosen goal before doing any work!",
    ];

    return llmInstruction.join("\n");
  }

  private buildGroupedGoals(allGoals: GoalView[]): GroupedGoals {
    const groupMap = new Map<string, GoalView[]>();
    for (const goal of allGoals) {
      const group = groupMap.get(goal.status) ?? [];
      group.push(goal);
      groupMap.set(goal.status, group);
    }

    const orderedStatuses = [...groupMap.keys()].sort(
      (a, b) => (STATUS_ORDER[a] ?? 99) - (STATUS_ORDER[b] ?? 99),
    );

    const grouped: GroupedGoals = {};
    for (const status of orderedStatuses) {
      const goals = groupMap.get(status)!;
      grouped[status] = {
        hint: STATUS_HINTS[status] ?? "No action available",
        count: goals.length,
        goals: goals.map((g) => ({
          goalId: g.goalId,
          objective: g.objective,
          createdAt: g.createdAt,
        })),
      };
    }

    return grouped;
  }
}
