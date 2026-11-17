import { EntityRenderer } from "./EntityRenderer.js";
import { Annotation } from "../Annotation.js";

/**
 * ComponentContextView from ContextualGoalView
 */
export interface ComponentContextView {
  readonly componentId: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
}

/**
 * Renders Component entities for terminal output.
 */
export class ComponentRenderer implements EntityRenderer<ComponentContextView> {
  toHumanReadable(component: ComponentContextView): string {
    return `- ${component.name}: ${component.description}`;
  }

  toJSON(component: ComponentContextView): unknown {
    return {
      componentId: component.componentId,
      name: component.name,
      description: component.description,
      status: component.status,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: "instruction",
      text: "INSTRUCTION: You (the developer) MUST consider these components while implementing this goal.",
    };
  }

  getGroupHeader(): string {
    return "## Relevant Components:";
  }
}
