import { EntityRenderer } from "./EntityRenderer.js";
import { Annotation } from "../Annotation.js";

/**
 * InvariantContextView from ContextualGoalView
 */
export interface InvariantContextView {
  readonly invariantId: string;
  readonly category: string;
  readonly description: string;
}

/**
 * Renders Invariant entities for terminal output.
 * Invariants are non-negotiable requirements that MUST be adhered to.
 */
export class InvariantRenderer implements EntityRenderer<InvariantContextView> {
  toHumanReadable(invariant: InvariantContextView): string {
    return `- ${invariant.category}:\n  - ${invariant.description}`;
  }

  toJSON(invariant: InvariantContextView): unknown {
    return {
      invariantId: invariant.invariantId,
      category: invariant.category,
      description: invariant.description,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: "emphasis",
      text: "INSTRUCTION: You (the developer) MUST adhere to ALL of these invariants while implementing this goal.",
    };
  }

  getGroupHeader(): string {
    return "## Invariants:";
  }
}
