import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { CodifyGoalResponse } from "../../../../../application/context/goals/codify/CodifyGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  metaField,
  divider,
  contentLine,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.codify command output.
 * Encapsulates all output rendering for the codify goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCodifyOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal codification start.
   * Renders codification instructions including architectural reconciliation prompt.
   */
  buildSuccess(response: CodifyGoalResponse): TerminalOutput {
    this.builder.reset();

    const goal = response.goalContextView.goal;

    // Header
    const headerLines = [
      heading("Goal Codifying — Architectural Reconciliation"),
      metaField("Goal ID", goal.goalId, 12),
      metaField("Objective", goal.objective, 12),
      metaField("Status", goal.status, 12),
    ];
    if (goal.branch) {
      headerLines.push(metaField("Branch", goal.branch, 12));
    }
    if (goal.worktree) {
      headerLines.push(metaField("Worktree", goal.worktree, 12));
    }
    headerLines.push(divider());
    this.builder.addPrompt(headerLines.join("\n"));

    // Section 1: Capture new learnings
    this.builder.addPrompt(
      [
        heading("Capture Learnings"),
        contentLine(
          "@LLM: Reflect on your interaction with the user during this goal.",
        ),
        contentLine(
          "Did it surface any NEW invariants, guidelines, decisions, components, dependencies, or architectural patterns not yet captured?",
        ),
        contentLine("Were you corrected in a way that reveals a missing rule?"),
        contentLine("Only propose additions that are:"),
        contentLine("  - Universal (applicable beyond this specific goal)"),
        contentLine(
          "  - Dense (one sentence, no examples unless the example IS the rule)",
        ),
        contentLine(
          "  - Actionable (changes how code is written or decisions are made)",
        ),
        contentLine(
          "If nothing qualifies, say so. Avoid restating what's already captured.",
        ),
        contentLine("Run 'jumbo --help' for command details."),
      ].join("\n"),
    );

    // Section 2: Review registered entities for staleness
    this.builder.addPrompt(
      [
        heading("Review Registered Entities"),
        contentLine(
          "@LLM: This goal may have changed the codebase in ways that affect registered entities.",
        ),
        contentLine(
          "For each entity type below, consider whether any existing registrations need updating based on the work performed.",
        ),
        "",
        heading("Components"),
        contentLine(
          "Did any component descriptions, responsibilities, or paths change? Were any components deprecated or removed?",
        ),
        contentLine(
          '  Update: jumbo component update --id <id> --description "..." --responsibility "..."',
        ),
        contentLine(
          '  Deprecate: jumbo component deprecate --id <id> --reason "..."',
        ),
        contentLine(
          '  Add new: jumbo component add --name "..." --type "..." --description "..." --responsibility "..." --path "..."',
        ),
        "",
        heading("Decisions"),
        contentLine(
          "Were any architectural decisions made, superseded, or invalidated by this work?",
        ),
        contentLine(
          '  Add: jumbo decision add --title "..." --context "..." --rationale "..."',
        ),
        contentLine(
          '  Update: jumbo decision update --id <id> --rationale "..."',
        ),
        contentLine(
          "  Supersede: jumbo decision supersede --id <id> --new-decision-id <new-id>",
        ),
        "",
        heading("Invariants"),
        contentLine(
          "Were any invariants introduced, weakened, strengthened, or made obsolete?",
        ),
        contentLine(
          '  Add: jumbo invariant add --title "..." --description "..." --rationale "..."',
        ),
        contentLine(
          '  Update: jumbo invariant update --id <id> --description "..." --rationale "..."',
        ),
        contentLine("  Remove: jumbo invariant remove --id <id>"),
        "",
        heading("Guidelines"),
        contentLine(
          "Were any coding, testing, or documentation guidelines introduced or changed?",
        ),
        contentLine(
          '  Add: jumbo guideline add --category "..." --title "..." --description "..."',
        ),
        contentLine(
          '  Update: jumbo guideline update --guideline-id <id> --description "..."',
        ),
        contentLine("  Remove: jumbo guideline remove --guideline-id <id>"),
        "",
        heading("Dependencies"),
        contentLine(
          "Were any inter-component dependencies added, removed, or changed?",
        ),
        contentLine(
          '  Add: jumbo dependency add --consumer-id <id> --provider-id <id> --contract "..."',
        ),
        contentLine(
          '  Update: jumbo dependency update --id <id> --contract "..."',
        ),
        contentLine("  Remove: jumbo dependency remove --id <id>"),
        "",
        heading("Relations"),
        contentLine(
          "Should any new relations be established between entities touched by this goal?",
        ),
        contentLine(
          "  Add: jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --type <type> --strength <level>",
        ),
      ].join("\n"),
    );

    this.builder.addPrompt(
      [
        heading("Update Documentation"),
        contentLine(
          "@LLM: Did you make any changes that should be reflected in the user documentation?",
        ),
        contentLine(
          "Did the changes introduce any new features, modify existing behavior, or fix bugs that users should be aware of?",
        ),
        contentLine("If yes to either, then:"),
        contentLine("  - Propose updates to the ~/docs/*"),
        contentLine("  - Update the CHANGELOG.md"),
      ].join("\n"),
    );

    // Next step
    this.builder.addPrompt(
      [
        heading("Next Step"),
        contentLine(
          "After completing the reconciliation above, close the goal:",
        ),
        contentLine(`  Run: jumbo goal close --id ${goal.goalId}`),
        divider(),
      ].join("\n"),
    );

    return this.builder.build();
  }

  /**
   * Build output for goal codification failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to codify goal")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
