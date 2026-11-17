import { EntityRenderer } from "./EntityRenderer.js";
import { Annotation } from "../Annotation.js";

/**
 * DecisionContextView from ContextualGoalView
 */
export interface DecisionContextView {
  readonly decisionId: string;
  readonly title: string;
  readonly rationale: string;
  readonly status: string;
}

/**
 * Renders Decision entities for terminal output.
 */
export class DecisionRenderer implements EntityRenderer<DecisionContextView> {
  toHumanReadable(decision: DecisionContextView): string {
    return `- ${decision.title}: ${decision.rationale}`;
  }

  toJSON(decision: DecisionContextView): unknown {
    return {
      decisionId: decision.decisionId,
      title: decision.title,
      rationale: decision.rationale,
      status: decision.status,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: "instruction",
      text: "INSTRUCTION: The solution may contain artifacts that reflect previous design decisions.\nTherefore, you MUST consider these design decisions while implementing this goal to ensure the trajectory of the solution remains consistent.",
    };
  }

  getGroupHeader(): string {
    return "## Relevant Decisions:";
  }
}
