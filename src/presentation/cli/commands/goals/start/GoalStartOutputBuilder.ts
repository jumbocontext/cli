import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { ContextualGoalView } from "../../../../../application/context/goals/get/ContextualGoalView.js";
import {
  heading,
  divider,
  metaField,
  contentLine,
  wrapContent,
  wrapBulletContinuation,
} from "../../../rendering/OutputLayout.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";

/**
 * Specialized builder for goal.start command output.
 * Preserves the existing effective prompt structure that guides LLM implementation.
 *
 * Renders goal context as structured LLM implementation instructions.
 */
export class GoalStartOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build complete goal start output from context view.
   * Preserves existing prompt structure and instructions.
   */
  build(contextualView: ContextualGoalView): TerminalOutput {
    const goal = contextualView.goal;
    const context = contextualView.context;

    // Opening prompt: Goal Implementation Instructions
    this.builder.addPrompt(
      heading("Goal Implementation Instructions") +
        "\n\n" +
        wrapContent(
          "You are the developer tasked with implementing the goal outlined below. DO NOT DEVIATE from the instructions.",
        ).join("\n") +
        "\n" +
        wrapContent(
          "You (the developer) are the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.",
        ).join("\n") +
        "\n" +
        wrapContent(
          "You write perfect, efficient, secure, and well-documented code.",
        ).join("\n"),
    );

    // Objective section
    this.builder.addPrompt(
      heading("Objective") +
        "\n" +
        contentLine(`'${goal.objective}'`) +
        "\n\n" +
        "INSTRUCTION: Your (the developer's) purpose for this goal is to fulfill this objective.",
    );

    // Review Issues section (if rejected goal is being restarted)
    if (goal.reviewIssues) {
      this.builder.addPrompt(
        heading("Review Issues") +
          "\n" +
          wrapContent(goal.reviewIssues)
            .map((line) => Colors.warning(line))
            .join("\n") +
          "\n\n" +
          "INSTRUCTION: This goal was rejected during QA review. You (the developer) MUST address these issues before submitting the goal again.",
      );
    }

    // Success Criteria section
    const successCriteriaLines = goal.successCriteria.flatMap((c) =>
      wrapBulletContinuation(c),
    );
    this.builder.addPrompt(
      heading("Success Criteria") +
        "\n" +
        successCriteriaLines.join("\n") +
        "\n\n" +
        "INSTRUCTION: Your (the developer's) success in fulfilling the objective is measured by these specific criteria and adherence to the instructions below.",
    );

    // Progress section (if exists)
    if (goal.progress && goal.progress.length > 0) {
      const progressLines = goal.progress.flatMap((p) =>
        wrapBulletContinuation(p),
      );
      this.builder.addPrompt(
        heading("Current Progress") +
          "\n" +
          progressLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: Implementation of this goal has previously been started.\n" +
          "Review the current progress to understand what has already been accomplished and continue from there.",
      );
    }

    // Branch/Worktree section (if defined)
    if (goal.branch || goal.worktree) {
      let workspaceLines = heading("Workspace") + "\n";
      if (goal.branch) {
        workspaceLines +=
          metaField("Branch", Colors.primary(goal.branch)) + "\n";
      }
      if (goal.worktree) {
        workspaceLines +=
          metaField("Worktree", Colors.primary(goal.worktree)) + "\n";
      }
      workspaceLines +=
        "\nINSTRUCTION: You (the developer) MUST isolate your work in the identified " +
        (goal.branch && goal.worktree
          ? "branch and worktree"
          : goal.branch
            ? "branch"
            : "worktree") +
        ".";
      this.builder.addPrompt(workspaceLines);
    }

    // Scope section (if scoped)
    if (this.isScoped(contextualView)) {
      if (goal.scopeIn && goal.scopeIn.length > 0) {
        const scopeInLines = goal.scopeIn.flatMap((s) =>
          wrapBulletContinuation(s),
        );
        this.builder.addPrompt(
          heading("Scope: In") +
            "\n" +
            scopeInLines.join("\n") +
            "\n\n" +
            "INSTRUCTION: You (the developer) MUST work within the defined scope.",
        );
      }

      if (goal.scopeOut && goal.scopeOut.length > 0) {
        const scopeOutLines = goal.scopeOut.flatMap((s) =>
          wrapBulletContinuation(s),
        );
        this.builder.addPrompt(
          heading("Scope: Out") +
            "\n" +
            scopeOutLines.join("\n") +
            "\n\n" +
            "INSTRUCTION: Your (the developer) work MUST NOT overlap these items.",
        );
      }
    }

    // Components section
    if (context.components.length > 0) {
      const componentsLines = context.components.flatMap((c) =>
        wrapBulletContinuation(`${c.entity.name}: ${c.entity.description}`),
      );
      this.builder.addPrompt(
        heading("Relevant Components") +
          "\n" +
          componentsLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: You (the developer) MUST consider these components while implementing this goal.",
      );
    }

    // Dependencies section
    if (context.dependencies.length > 0) {
      const dependenciesLines = context.dependencies.flatMap((d) => {
        const version = d.entity.versionConstraint
          ? `@${d.entity.versionConstraint}`
          : "";
        const purpose =
          d.entity.contract || d.entity.endpoint || "External dependency";
        return wrapBulletContinuation(
          `${d.entity.ecosystem}:${d.entity.packageName}${version} (${d.entity.name}): ${purpose}`,
        );
      });
      this.builder.addPrompt(
        heading("Relevant Dependencies") +
          "\n" +
          dependenciesLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: You (the developer) MUST consider the following dependencies while implementing this goal.",
      );
    }

    // Decisions section
    if (context.decisions.length > 0) {
      const decisionsLines = context.decisions.flatMap((d) =>
        wrapBulletContinuation(`${d.entity.title}: ${d.entity.rationale}`),
      );
      this.builder.addPrompt(
        heading("Relevant Decisions") +
          "\n" +
          decisionsLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: The solution may contain artifacts that reflect previous design decisions.\n" +
          "Therefore, you MUST consider these design decisions while implementing this goal to ensure the trajectory of the solution remains consistent.",
      );
    }

    // Invariants section (CRITICAL - emphasized)
    if (context.invariants.length > 0) {
      const invariantsLines = context.invariants.flatMap((inv) =>
        wrapBulletContinuation(
          `${inv.entity.title}: ${inv.entity.description}`,
        ),
      );
      this.builder.addPrompt(
        heading("Invariants") +
          "\n" +
          invariantsLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: You (the developer) MUST adhere to ALL of these invariants while implementing this goal.",
      );
    }

    // Guidelines section
    if (context.guidelines.length > 0) {
      const guidelinesLines = context.guidelines.flatMap((g) =>
        wrapBulletContinuation(`${g.entity.category}: ${g.entity.description}`),
      );
      this.builder.addPrompt(
        heading("Guidelines") +
          "\n" +
          guidelinesLines.join("\n") +
          "\n\n" +
          "INSTRUCTION: You (the developer) SHOULD follow these guidelines while implementing this goal.",
      );
    }

    // Closing prompt with additional instructions
    this.builder.addPrompt(
      divider() +
        "\n\n" +
        "@LLM: Goal context loaded. Work within scope.\n" +
        contentLine(
          `Track your progress by documenting completed sub-tasks with 'jumbo goal update-progress --id ${goal.goalId} --task-description <description>'.`,
        ) +
        "\n\n" +
        "CONTEXT MAINTENANCE: As you implement, register decisions, components, and relations in real-time — not as a cleanup step at the end, but as they happen:\n" +
        wrapBulletContinuation(
          'When you make an architectural choice: jumbo decision add --title "Chose X over Y" --rationale "Because Z" --context "Background"',
        ).join("\n") +
        "\n" +
        wrapBulletContinuation(
          'When you create a new component: jumbo component add --name "Name" --description "What it does"',
        ).join("\n") +
        "\n" +
        wrapBulletContinuation(
          "When you discover a new relation: jumbo relation add --from-type goal --from-id " +
            goal.goalId +
            ' --to-type <type> --to-id <id> --type involves --description "Why"',
        ).join("\n") +
        "\n" +
        wrapBulletContinuation(
          'When the user corrects your approach: jumbo invariant add --category "architecture" --description "The constraint" or jumbo guideline add --category "codingStyle" --description "The practice"',
        ).join("\n") +
        "\n" +
        contentLine(
          "Unregistered context is lost at session end. Capture it as it happens.",
        ),
    );

    // Review instructions (prominent)
    this.builder.addPrompt(
      divider() +
        "\n" +
        contentLine(
          "WHEN YOU'RE FINISHED IMPLEMENTING THEN THE NEXT STEP IS:",
        ) +
        "\n" +
        contentLine(`Run: jumbo goal submit --id ${goal.goalId}`) +
        "\n" +
        divider(),
    );

    return this.builder.build();
  }

  private isScoped(contextualView: ContextualGoalView): boolean {
    return (
      (Array.isArray(contextualView.goal.scopeIn) &&
        contextualView.goal.scopeIn.length > 0) ||
      (Array.isArray(contextualView.goal.scopeOut) &&
        contextualView.goal.scopeOut.length > 0)
    );
  }
}
