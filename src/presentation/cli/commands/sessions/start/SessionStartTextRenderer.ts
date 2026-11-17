import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContextOutputBuilder } from "./SessionContextOutputBuilder.js";
import { SessionGoalsOutputBuilder } from "./SessionGoalsOutputBuilder.js";

export interface SessionStartTextRenderResult {
  readonly blocks: string[];
  readonly llmInstruction: string;
}

export interface SessionStartStructuredContext {
  readonly projectContext: Record<string, unknown> | null;
  readonly sessionContext: Record<string, unknown>;
  readonly goals: Record<string, unknown>;
  readonly llmInstructions: {
    readonly sessionContext: string | null;
    readonly goalStart: string;
  };
}

/**
 * SessionStartTextRenderer - Formats session start context for LLM orientation.
 *
 * Delegates to session context and goals builders for legacy resume context.
 * Retained for backward compatibility with existing callers and tests.
 */
export class SessionStartTextRenderer {
  private readonly sessionContextOutputBuilder: SessionContextOutputBuilder;
  private readonly sessionGoalsOutputBuilder: SessionGoalsOutputBuilder;

  constructor() {
    this.sessionContextOutputBuilder = new SessionContextOutputBuilder();
    this.sessionGoalsOutputBuilder = new SessionGoalsOutputBuilder();
  }

  render(context: EnrichedSessionContext): SessionStartTextRenderResult {
    const sections = [
      ...this.sessionContextOutputBuilder
        .buildSessionContext(context)
        .getSections(),
      ...this.sessionGoalsOutputBuilder
        .buildGoalsOutput(this.getAllGoals(context))
        .getSections(),
    ];

    const blocks = sections
      .filter((s) => s.type === "prompt" && s.content)
      .map((s) => s.content as string);

    // Last two sections are the separator and goal start instruction.
    // Extract the instruction separately for the legacy return shape.
    const goalStartIndex = blocks.findIndex((b) =>
      b.includes("@LLM: Prompt the user"),
    );
    const llmInstruction =
      goalStartIndex >= 0 ? blocks.splice(goalStartIndex, 1)[0] : "";

    // Remove separator block
    const separatorIndex = blocks.findIndex((b) => b.trim() === "---");
    if (separatorIndex >= 0) {
      blocks.splice(separatorIndex, 1);
    }

    return { blocks, llmInstruction };
  }

  buildStructuredContext(
    context: EnrichedSessionContext,
  ): SessionStartStructuredContext {
    const contextData =
      this.sessionContextOutputBuilder.buildStructuredSessionContext(context);
    const goalsData = this.sessionGoalsOutputBuilder.buildStructuredGoals(
      this.getAllGoals(context),
    );

    return {
      projectContext: contextData.projectContext,
      sessionContext: contextData.sessionContext,
      goals: goalsData.goals,
      llmInstructions: {
        sessionContext: contextData.llmSessionContextInstruction,
        goalStart: goalsData.llmGoalStartInstruction,
      },
    };
  }

  renderSessionSummary(context: EnrichedSessionContext): string {
    return this.sessionContextOutputBuilder.renderSessionSummary(context);
  }

  private getAllGoals(context: EnrichedSessionContext) {
    return [
      ...context.context.activeGoals,
      ...context.context.pausedGoals,
      ...context.context.plannedGoals,
    ];
  }
}
