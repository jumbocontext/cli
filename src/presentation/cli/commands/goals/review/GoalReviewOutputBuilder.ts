import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ReviewGoalResponse } from "../../../../../application/context/goals/review/ReviewGoalResponse.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  divider,
  contentLine,
  wrapBulletContinuation,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

/**
 * Specialized builder for goal.review command output.
 * Encapsulates all output rendering for the review goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalReviewOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal review submission.
   * Renders comprehensive QA criteria for verification.
   */
  buildSuccess(response: ReviewGoalResponse): TerminalOutput {
    this.builder.reset();
    const goal = response.criteria.goal;
    const context = response.criteria.context;

    const lines: string[] = [];

    // Header
    lines.push("");
    lines.push(heading("Goal Review Instructions"));
    lines.push(
      ...wrapContent(
        "You are the quality assurance specialist tasked with reviewing the goal (outlined below) implementation. The implementation MUST NOT HAVE DEVIATED from the instructions.",
      ),
    );
    lines.push(
      ...wrapContent(
        "Your (the specialist's) skills are that of the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.",
      ),
    );
    lines.push(
      ...wrapContent(
        "You expect perfect, efficient, secure, and well-documented code.",
      ),
    );
    lines.push(
      ...wrapContent(
        "You are now in QA mode. Verify the implementation against the details below.",
      ),
    );
    lines.push(...wrapContent("Report and fix any failures."));
    lines.push(divider());
    lines.push("");

    // Objective and Success Criteria
    lines.push(heading("Objective"));
    lines.push(contentLine(`'${goal.objective}'`));
    lines.push(heading("Success Criteria"));
    goal.successCriteria.forEach((c) => {
      lines.push(...wrapBulletContinuation(c));
    });
    lines.push("");
    lines.push(
      contentLine(
        "VERIFY: Does the implementation succeed in fulfilling the objective and these specific criteria and adhere to the instructions below?",
      ),
    );
    lines.push(
      contentLine(
        "INSTRUCTION: If ANY criteria are NOT met, then note the issues for goal rejection.",
      ),
    );

    // Scope (if scoped)
    if (this.isScoped(response)) {
      lines.push("");

      if (goal.scopeIn && goal.scopeIn.length > 0) {
        lines.push(heading("Scope: In"));
        goal.scopeIn.forEach((item: string) => {
          lines.push(...wrapBulletContinuation(item));
        });
        lines.push("");
        lines.push(
          contentLine(
            "VERIFY: The implementation stayed within the defined scope.",
          ),
        );
        lines.push(
          contentLine(
            "INSTRUCTION: If any work was done outside the defined scope, then note the issues for goal rejection.",
          ),
        );
      }

      if (goal.scopeOut && goal.scopeOut.length > 0) {
        lines.push(heading("Scope: Out"));
        goal.scopeOut.forEach((item: string) => {
          lines.push(...wrapBulletContinuation(item));
        });
        lines.push("");
        lines.push(
          contentLine(
            "VERIFY: The implementation did not overlap these items.",
          ),
        );
        lines.push(
          contentLine(
            "INSTRUCTION: If any work overlapped these items, then note the issues for goal rejection.",
          ),
        );
      }
    }

    // Components
    if (context.components.length > 0) {
      lines.push("");
      lines.push(heading("Relevant Components"));
      context.components.forEach((c) => {
        lines.push(
          ...wrapBulletContinuation(
            `${c.entity.name}: ${c.entity.description}`,
          ),
        );
      });
      lines.push("");
      lines.push(
        contentLine(
          "VERIFY: These components were considered in the implementation.",
        ),
      );
      lines.push(
        contentLine(
          "INSTRUCTION: If any components were not considered, then note the issues for goal rejection.",
        ),
      );
    }

    // Dependencies
    if (context.dependencies.length > 0) {
      lines.push("");
      lines.push(heading("Relevant Dependencies"));
      context.dependencies.forEach((d) => {
        const version = d.entity.versionConstraint
          ? `@${d.entity.versionConstraint}`
          : "";
        const purpose =
          d.entity.contract || d.entity.endpoint || "External dependency";
        lines.push(
          ...wrapBulletContinuation(
            `${d.entity.ecosystem}:${d.entity.packageName}${version} (${d.entity.name}): ${purpose}`,
          ),
        );
      });
      lines.push("");
      lines.push(
        contentLine(
          "VERIFY: These dependencies are considered in the implementation.",
        ),
      );
      lines.push(
        contentLine(
          "INSTRUCTION: If any dependencies were not considered, then note the issues for goal rejection.",
        ),
      );
    }

    // Decisions
    if (context.decisions.length > 0) {
      lines.push("");
      lines.push(heading("Relevant Decisions"));
      context.decisions.forEach((d) => {
        lines.push(
          ...wrapBulletContinuation(`${d.entity.title}: ${d.entity.rationale}`),
        );
      });
      lines.push("");
      lines.push(
        contentLine(
          "NOTE: The solution may contain artifacts that reflect previous design decisions.",
        ),
      );
      lines.push(
        contentLine(
          "VERIFY: These design decisions are reflected in the implementation and ensure the trajectory of the solution is consistent.",
        ),
      );
      lines.push(
        contentLine(
          "INSTRUCTION: If any design decisions are not reflected or the trajectory is inconsistent, then note the issues for goal rejection.",
        ),
      );
    }

    // Invariants
    if (context.invariants.length > 0) {
      lines.push("");
      lines.push(heading("Invariants"));
      context.invariants.forEach((inv) => {
        lines.push(
          ...wrapBulletContinuation(
            `${inv.entity.title}: ${inv.entity.description}`,
          ),
        );
      });
      lines.push("");
      lines.push(
        contentLine(
          "VERIFY: The implementation adheres to ALL of these invariants.",
        ),
      );
      lines.push(
        contentLine(
          "INSTRUCTION: If the implementation does not adhere to any of these invariants, then note the issues for goal rejection.",
        ),
      );
    }

    // Guidelines
    if (context.guidelines.length > 0) {
      lines.push("");
      lines.push(heading("Guidelines"));
      context.guidelines.forEach((g) => {
        lines.push(
          ...wrapBulletContinuation(
            `${g.entity.category}: ${g.entity.description}`,
          ),
        );
      });
      lines.push("");
      lines.push(
        contentLine("VERIFY: The implementation follows these guidelines."),
      );
      lines.push(
        contentLine(
          "INSTRUCTION: If the implementation does not follow any of these guidelines, then note the issues for goal rejection.",
        ),
      );
    }

    // Final instructions
    lines.push("");
    lines.push(divider());
    lines.push(heading("Next Steps"));
    lines.push(contentLine("If ALL criteria are met:"));
    lines.push(
      contentLine(`  Run: jumbo goal approve --id ${response.goalId}`),
    );
    lines.push("");
    lines.push(contentLine("If ANY criteria are NOT met:"));
    lines.push(
      contentLine(
        `  Note the issues and reject the goal: jumbo goal reject --id ${response.goalId} --audit-findings <findings>`,
      ),
    );
    lines.push(divider());

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  /**
   * Build output for goal review failure.
   * Renders error message when goal review fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to submit goal for review")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }

  /**
   * Helper to determine if goal is scoped
   */
  private isScoped(response: ReviewGoalResponse): boolean {
    const goal = response.criteria.goal;
    return (
      (Array.isArray(goal.scopeIn) && goal.scopeIn.length > 0) ||
      (Array.isArray(goal.scopeOut) && goal.scopeOut.length > 0)
    );
  }
}
