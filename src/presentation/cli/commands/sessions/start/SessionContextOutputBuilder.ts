import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { ProjectView } from "../../../../../application/context/project/ProjectView.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";
import { SessionInstructionSignal } from "../../../../../application/context/sessions/SessionInstructionSignal.js";
import {
  ARCHITECTURE_DEPRECATION_NOTICE,
  ARCHITECTURE_MIGRATION_TABLE,
} from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";

/**
 * SessionContextOutputBuilder - Builds output for session context orientation.
 *
 * Renders project context (name, purpose, audiences, pains) and session summary
 * (focus, status, paused goals, recent decisions).
 * Includes brownfield onboarding and paused goals resume @LLM prompts.
 */
export class SessionContextOutputBuilder {
  private readonly builder: TerminalOutputBuilder;
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.builder = new TerminalOutputBuilder();
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Build human-readable session context output.
   * Returns project context block (if available) and session summary block.
   */
  buildSessionContext(context: EnrichedSessionContext): TerminalOutput {
    this.builder.reset();

    const projectContextYaml = this.renderProjectContext(
      context.context.projectContext,
    );
    if (projectContextYaml) {
      this.builder.addPrompt(projectContextYaml);
    }

    this.builder.addPrompt(this.renderSessionSummary(context));

    return this.builder.build();
  }

  /**
   * Build structured session context data for JSON output.
   */
  buildStructuredSessionContext(context: EnrichedSessionContext): {
    projectContext: Record<string, unknown> | null;
    sessionContext: Record<string, unknown>;
    llmSessionContextInstruction: string | null;
  } {
    const sessionContextResult = this.buildSessionContextData(context);

    return {
      projectContext: this.buildProjectContextData(
        context.context.projectContext,
      ),
      sessionContext: sessionContextResult.data.sessionContext as Record<
        string,
        unknown
      >,
      llmSessionContextInstruction: sessionContextResult.llmInstruction ?? null,
    };
  }

  private renderProjectContext(projectContext: ProjectView | null): string {
    const contextData = this.buildProjectContextData(projectContext);

    if (!contextData) {
      return "";
    }

    return this.yamlFormatter.toYaml({ projectContext: contextData });
  }

  renderSessionSummary(context: EnrichedSessionContext): string {
    const sessionContextResult = this.buildSessionContextData(context);

    let output = this.yamlFormatter.toYaml(sessionContextResult.data);

    if (sessionContextResult.llmInstruction) {
      output += sessionContextResult.llmInstruction;
    }

    return output;
  }

  private buildProjectContextData(
    projectContext: ProjectView | null,
  ): Record<string, unknown> | null {
    if (!projectContext) {
      return null;
    }

    const contextData: Record<string, unknown> = {
      name: projectContext.name,
      purpose: projectContext.purpose || "Not defined",
    };

    return contextData;
  }

  private buildSessionContextData(context: EnrichedSessionContext): {
    data: Record<string, unknown>;
    llmInstruction?: string;
  } {
    if (
      context.instructions.includes(
        SessionInstructionSignal.BROWNFIELD_ONBOARDING,
      )
    ) {
      return {
        data: {
          sessionContext: {
            message:
              "No previous session context available. This appears to be your first session with Jumbo on this project.",
          },
        },
        llmInstruction: this.buildBrownfieldInstruction(),
      };
    }

    if (!context.session) {
      return {
        data: {
          sessionContext: {
            message: "No previous session context available.",
          },
        },
      };
    }

    const contextData: Record<string, unknown> = {
      sessionContext: {
        focus: context.session.focus ?? "Not yet defined",
        status: context.session.status,
      },
    };

    const sessionCtx = contextData.sessionContext as Record<string, unknown>;

    if (context.context.pausedGoals.length > 0) {
      sessionCtx.pausedGoals = context.context.pausedGoals.map((g) => {
        const pausedGoal: Record<string, unknown> = {
          goalId: g.goalId,
          objective: g.objective,
          pausedAt: g.updatedAt,
        };
        if (g.note) {
          pausedGoal.note = g.note;
        }
        return pausedGoal;
      });
    }

    if (context.context.recentDecisions.length > 0) {
      sessionCtx.recentDecisions = context.context.recentDecisions.map((d) => ({
        decisionId: d.decisionId,
        title: d.title,
        rationale: d.rationale,
      }));
    }

    const llmParts: string[] = [];

    if (context.context.pausedGoals.length > 0) {
      llmParts.push(
        "@LLM: Goals were paused in your workspace. To pick up where you left off, run:\n  jumbo goal resume --id <goal-id>",
      );
    }

    if (
      context.instructions.includes(
        SessionInstructionSignal.ARCHITECTURE_DEPRECATED,
      )
    ) {
      llmParts.push(this.buildArchitectureDeprecationNotice());
    }

    const llmInstruction =
      llmParts.length > 0 ? "\n\n" + llmParts.join("\n\n") : undefined;

    return { data: contextData, llmInstruction };
  }

  private buildBrownfieldInstruction(): string {
    return [
      "",
      "@LLM: This is a BROWNFIELD PROJECT — your Jumbo workspace has no context yet.",
      "Jumbo is your persistent memory. What you register here survives session boundaries and is available to any agent working on this project.",
      "",
      "REQUIRED ACTION: Proactively engage the user with the following approach:",
      "",
      "1. GREET and ACKNOWLEDGE: \"Hi! I can see that you've added Jumbo to this project. ",
      '   This looks like an existing codebase with valuable context to preserve."',
      "",
      '2. OFFER HELP: "Would you like me to help transfer your existing project knowledge into Jumbo? ',
      '   I can scan your documentation, code structure, and patterns to capture:"',
      "   - Project purpose and target audience (from README, docs)",
      "   - Architectural components and dependencies (from code structure)",
      "   - Development guidelines and coding standards (from patterns)",
      "   - Architectural decisions (from docs, comments, ADRs)",
      "",
      "3. GET PERMISSION: \"I'll ask for your confirmation before adding anything to Jumbo. ",
      '   Should we start by scanning your project documentation?"',
      "",
      "IMPORTANT:",
      "- Take initiative: Don't wait passively. Actively offer to help.",
      "- Be conversational: Use natural language, not robotic instructions.",
      "- Human-in-the-loop: Always get user confirmation before running jumbo commands.",
      "- Start with docs: README.md, package.json, or docs/ are good starting points.",
      "",
      "AVAILABLE COMMANDS (use after getting user permission):",
      "- jumbo component add --name 'ComponentName' --description 'What it does'",
      "- jumbo decision add --title 'Decision' --rationale 'Why' --context 'Background'",
      "- jumbo guideline add --category 'testing' --description 'Guideline text'",
      "- jumbo invariant add --category 'architecture' --description 'Non-negotiable rule'",
      "- jumbo dependency add --name 'package' --version '1.0' --purpose 'What it does'",
      "",
      "Run 'jumbo --help' to see all available commands.",
    ].join("\n");
  }

  private buildArchitectureDeprecationNotice(): string {
    return [
      `@LLM: ${ARCHITECTURE_DEPRECATION_NOTICE}`,
      "Migrate existing architecture data to individual entities:",
      ARCHITECTURE_MIGRATION_TABLE,
      "Do not use 'jumbo architecture define' or 'jumbo architecture update'.",
    ].join("\n");
  }
}
