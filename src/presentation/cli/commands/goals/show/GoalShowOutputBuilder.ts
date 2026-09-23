import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';
import { Colors, BrandColors, Symbols, Templates, wordWrap } from '../../../rendering/StyleConfig.js';
import {
  EDGE, CONTENT_PAD, INDENT_PAD, WRAP_CONTENT, WRAP_INDENT,
  bar, divider, heading, metaField, contentLine, indentLine,
  wrapContent, wrapBulletContinuation,
} from '../../../rendering/OutputLayout.js';

const STATUS_DISPLAY: Record<string, { symbol: string; color: (s: string) => string; label: string }> = {
  doing:       { symbol: Symbols.filledCircle, color: Colors.success,  label: "In Progress" },
  blocked:     { symbol: Symbols.cross,        color: Colors.error,    label: "Blocked" },
  defined:     { symbol: Symbols.dot,          color: Colors.muted,    label: "Planned" },
  postponed:   { symbol: Symbols.dot,          color: Colors.warning,  label: "Postponed" },
  done:        { symbol: Symbols.check,        color: Colors.success,  label: "Completed" },
  refined:     { symbol: Symbols.check,        color: Colors.accent,   label: "Ready to Start" },
  paused:      { symbol: Symbols.dot,          color: Colors.warning,  label: "Paused" },
  "in-review": { symbol: Symbols.filledCircle, color: Colors.warning,  label: "Awaiting QA" },
  approved:    { symbol: Symbols.check,        color: Colors.success,  label: "Ready for Codification" },
  rejected:    { symbol: Symbols.cross,        color: Colors.error,    label: "Needs Rework" },
  submitted:   { symbol: Symbols.filledCircle, color: Colors.success,  label: "Submitted" },
  unblocked:   { symbol: Symbols.filledCircle, color: Colors.accent,   label: "Ready to Resume" },
};

/**
 * Specialized builder for goal.show command output.
 * Encapsulates all output rendering for the show goal command.
 *
 * Visual language follows the Jumbo design system (mockups/design-system.svg):
 * - BrandColors.jumboBlue accent bar (|) as structural element at x=24
 * - Section headings at x=38, content at x=42, indented at x=54
 * - Only two dividers: after metadata block, before related context band
 * - BrandColors.accentCyan for entity names in Band 2
 * - Static footer with ➤ arrow
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalShowOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  private formatStatus(status: string): string {
    const entry = STATUS_DISPLAY[status];
    if (!entry) return Colors.primary(status);
    return `${entry.color(entry.symbol)} ${Colors.bold(Colors.primary(status))}`;
  }

  private wrapContentWithPrefix(prefix: string, text: string): string[] {
    const prefixLen = prefix.length + 1; // prefix + space
    const firstLineMax = WRAP_CONTENT - prefixLen;
    const words = text.split(/\s+/);
    const resultLines: string[] = [];
    let current = "";
    let isFirst = true;

    for (const word of words) {
      const max = isFirst ? firstLineMax : WRAP_CONTENT;
      if (current.length === 0) {
        current = word;
      } else if (current.length + 1 + word.length <= max) {
        current += " " + word;
      } else {
        if (isFirst) {
          resultLines.push(`${EDGE}${CONTENT_PAD}${BrandColors.accentCyan(prefix)} ${Colors.primary(current)}`);
          isFirst = false;
        } else {
          resultLines.push(`${EDGE}${CONTENT_PAD}${Colors.primary(current)}`);
        }
        current = word;
      }
    }
    if (current.length > 0) {
      if (isFirst) {
        resultLines.push(`${EDGE}${CONTENT_PAD}${BrandColors.accentCyan(prefix)} ${Colors.primary(current)}`);
      } else {
        resultLines.push(`${EDGE}${CONTENT_PAD}${Colors.primary(current)}`);
      }
    }

    return resultLines;
  }

  /**
   * Build output for TTY (human-readable formatted text).
   * Renders complete goal details with all fields.
   */
  build(contextualView: ContextualGoalView): TerminalOutput {
    this.builder.reset();
    const goal = contextualView.goal;
    const context = contextualView.context;
    const lines: string[] = [];

    // ── Band 1: Goal Identity + Details ──

    // Header: "| Goal" heading with title as content below
    lines.push("");
    lines.push(heading("Goal"));
    lines.push(contentLine(Colors.primary(goal.title || "Untitled Goal")));

    // Metadata block
    lines.push("");
    lines.push(metaField("Id", Colors.muted(goal.goalId)));
    lines.push(metaField("Status", this.formatStatus(goal.status)));
    lines.push(metaField("Version", Colors.muted(String(goal.version))));
    lines.push(metaField("Created", Colors.muted(goal.createdAt)));
    lines.push(metaField("Updated", Colors.muted(goal.updatedAt)));

    if (goal.nextGoalId) {
      lines.push(metaField("Next", Colors.muted(goal.nextGoalId)));
    }

    if (goal.prerequisiteGoals && goal.prerequisiteGoals.length > 0) {
      for (const prereqId of goal.prerequisiteGoals) {
        lines.push(metaField("Prereq", Colors.muted(prereqId)));
      }
    }

    // Divider 1: metadata → objective
    lines.push("");
    lines.push(divider());
    lines.push("");

    // Objective — wrapped at ~66 chars
    lines.push(heading("Objective"));
    lines.push(...wrapContent(goal.objective));

    // Note
    if (goal.note) {
      lines.push("");
      lines.push(heading("Note"));
      lines.push(...wrapContent(goal.note));
    }

    // Review Issues
    if (goal.reviewIssues) {
      lines.push("");
      lines.push(heading("Review Issues"));
      lines.push(contentLine(Colors.warning(goal.reviewIssues)));
    }

    // Success Criteria — bullet at x=42, text/continuation at x=54
    if (goal.successCriteria.length > 0) {
      lines.push("");
      lines.push(heading("Success Criteria"));
      for (const criterion of goal.successCriteria) {
        lines.push(...wrapBulletContinuation(criterion));
      }
    }

    // Current Progress — mirrors goal.start progress rendering
    if (goal.progress.length > 0) {
      lines.push("");
      lines.push(heading("Current Progress"));
      for (const progressEntry of goal.progress) {
        lines.push(...wrapBulletContinuation(progressEntry));
      }
    }

    // Scope
    if (goal.scopeIn.length > 0 || goal.scopeOut.length > 0) {
      lines.push("");
      lines.push(heading("Scope"));
      if (goal.scopeIn.length > 0) {
        lines.push(contentLine(Colors.bold("In:")));
        for (const item of goal.scopeIn) {
          lines.push(indentLine(`${Colors.success(Symbols.check)} ${Colors.primary(item)}`));
        }
      }
      if (goal.scopeOut.length > 0) {
        lines.push(contentLine(Colors.bold("Out:")));
        for (const item of goal.scopeOut) {
          lines.push(indentLine(`${Colors.error(Symbols.cross)} ${Colors.dim(item)}`));
        }
      }
    }

    // Workspace
    if (goal.branch || goal.worktree) {
      lines.push("");
      lines.push(heading("Workspace"));
      if (goal.branch) {
        lines.push(metaField("Branch", Colors.primary(goal.branch)));
      }
      if (goal.worktree) {
        lines.push(metaField("Worktree", Colors.primary(goal.worktree)));
      }
    }

    // Claim
    if (goal.claimedBy) {
      lines.push("");
      lines.push(heading("Claim"));
      lines.push(metaField("Claimed By", Colors.primary(goal.claimedBy)));
      lines.push(metaField("Claimed At", Colors.muted(goal.claimedAt!)));
      lines.push(metaField("Expires At", Colors.muted(goal.claimExpiresAt!)));
    }

    this.builder.addPrompt(lines.join("\n"));

    // ── Band 2: Related Context ──

    const hasArchContext = context.components.length > 0 ||
      context.dependencies.length > 0 ||
      context.decisions.length > 0 ||
      context.invariants.length > 0 ||
      context.guidelines.length > 0;

    if (hasArchContext) {
      const band2: string[] = [];

      // Divider 2: goal details → related context
      band2.push(divider());

      if (context.components.length > 0) {
        band2.push("");
        band2.push(heading("Related Components"));
        for (let i = 0; i < context.components.length; i++) {
          if (i > 0) band2.push("");
          band2.push(contentLine(BrandColors.accentCyan(context.components[i].entity.name)));
          band2.push(...wrapContent(context.components[i].entity.description));
        }
      }

      if (context.dependencies.length > 0) {
        band2.push("");
        band2.push(heading("Related Dependencies"));
        for (let i = 0; i < context.dependencies.length; i++) {
          if (i > 0) band2.push("");
          const dependency = context.dependencies[i];
          const version = dependency.entity.versionConstraint ? `@${dependency.entity.versionConstraint}` : "";
          const purpose = dependency.entity.contract || dependency.entity.endpoint || "External dependency";
          band2.push(contentLine(BrandColors.accentCyan(`${dependency.entity.ecosystem}:${dependency.entity.packageName}${version}`)));
          band2.push(...wrapContent(purpose));
        }
      }

      if (context.decisions.length > 0) {
        band2.push("");
        band2.push(heading("Related Decisions"));
        for (let i = 0; i < context.decisions.length; i++) {
          if (i > 0) band2.push("");
          const decision = context.decisions[i].entity;
          band2.push(contentLine(BrandColors.accentCyan(decision.title)));
          if (decision.context) {
            band2.push(contentLine(Colors.bold("Context:")));
            band2.push(...wrapContent(decision.context));
          }
          if (decision.rationale) {
            band2.push(contentLine(Colors.bold("Rationale:")));
            band2.push(...wrapContent(decision.rationale));
          }
        }
      }

      if (context.invariants.length > 0) {
        band2.push("");
        band2.push(heading("Invariants"));
        for (let i = 0; i < context.invariants.length; i++) {
          if (i > 0) band2.push("");
          band2.push(contentLine(BrandColors.accentCyan(context.invariants[i].entity.title)));
          band2.push(...wrapContent(context.invariants[i].entity.description));
        }
      }

      if (context.guidelines.length > 0) {
        band2.push("");
        band2.push(heading("Guidelines"));
        for (let i = 0; i < context.guidelines.length; i++) {
          if (i > 0) band2.push("");
          band2.push(...this.wrapContentWithPrefix(
            `[${context.guidelines[i].entity.category}]`,
            context.guidelines[i].entity.description
          ));
        }
      }

      this.builder.addPrompt("\n\n" + band2.join("\n"));
    }

    // Footer — divider + directive
    this.builder.addPrompt(
      "\n" + divider() + "\n\n" +
      `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To start: jumbo goal start --id ${goal.goalId}`)}\n`
    );

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders complete goal context as structured object.
   */
  buildStructuredOutput(contextualView: ContextualGoalView): TerminalOutput {
    this.builder.reset();
    const goal = contextualView.goal;
    const context = contextualView.context;

    this.builder.addData({
      goal: {
        goalId: goal.goalId,
        title: goal.title,
        objective: goal.objective,
        successCriteria: goal.successCriteria,
        scopeIn: goal.scopeIn,
        scopeOut: goal.scopeOut,
        status: goal.status,
        version: goal.version,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        note: goal.note,
        reviewIssues: goal.reviewIssues,
        progress: goal.progress,
        nextGoalId: goal.nextGoalId,
        prerequisiteGoals: goal.prerequisiteGoals,
        claimedBy: goal.claimedBy,
        claimedAt: goal.claimedAt,
        claimExpiresAt: goal.claimExpiresAt,
        branch: goal.branch,
        worktree: goal.worktree
      },
      components: context.components,
      dependencies: context.dependencies,
      decisions: context.decisions,
      invariants: context.invariants,
      guidelines: context.guidelines
    });
    return this.builder.build();
  }

  /**
   * Build output for goal not found error.
   * Renders error message when goal doesn't exist.
   */
  buildGoalNotFoundError(goalId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(Templates.errorMessage("Goal not found"));
    this.builder.addData({ message: `No goal exists with ID: ${goalId}` });
    return this.builder.build();
  }

  /**
   * Build output for goal show failure.
   * Renders error message when showing goal fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(Templates.errorMessage("Failed to show goal"));
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
