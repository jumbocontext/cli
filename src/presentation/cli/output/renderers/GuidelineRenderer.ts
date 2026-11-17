import { EntityRenderer } from "./EntityRenderer.js";
import { Annotation } from "../Annotation.js";

/**
 * GuidelineContextView from ContextualGoalView
 */
export interface GuidelineContextView {
  readonly guidelineId: string;
  readonly category: string;
  readonly description: string;
}

/**
 * Renders Guideline entities for terminal output.
 */
export class GuidelineRenderer implements EntityRenderer<GuidelineContextView> {
  toHumanReadable(guideline: GuidelineContextView): string {
    return `- ${guideline.category}: ${guideline.description}`;
  }

  toJSON(guideline: GuidelineContextView): unknown {
    return {
      guidelineId: guideline.guidelineId,
      category: guideline.category,
      description: guideline.description,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: "instruction",
      text: "INSTRUCTION: You (the developer) SHOULD follow these guidelines while implementing this goal.",
    };
  }

  getGroupHeader(): string {
    return "## Guidelines:";
  }
}
