import { Section } from "../Section.js";
import { TerminalOutput } from "../TerminalOutput.js";
import { HookOutput } from "../HookOutput.js";
import { EntityRendererRegistry } from "./EntityRendererRegistry.js";

/**
 * Renders TerminalOutput as strict JSON for hook integration.
 * No stdout pollution - produces pure JSON only.
 */
export class JsonRenderer {
  constructor(private readonly registry: EntityRendererRegistry) {}

  render(output: TerminalOutput): HookOutput {
    const sections = output.getSections();

    return {
      decision: "allow",
      promptSections: sections.map((section) => this.renderSection(section)),
    };
  }

  private renderSection(section: Section): {
    type: string;
    content: unknown;
    annotation?: string;
  } {
    switch (section.type) {
      case "prompt":
        return {
          type: "prompt",
          content: section.content,
        };

      case "data":
        return {
          type: "data",
          content: section.content,
          annotation: section.metadata?.annotation?.text,
        };

      case "annotation":
        return {
          type: "annotation",
          content: section.content,
        };

      case "group":
        return this.renderGroupSection(section);

      default:
        return {
          type: "unknown",
          content: section.content,
        };
    }
  }

  private renderGroupSection(section: Section): {
    type: string;
    content: unknown;
    annotation?: string;
  } {
    const { groupHeader, annotation, rendererType } = section.metadata || {};
    const entities = section.content as unknown[];

    // Use entity renderer if available
    const renderer = rendererType ? this.registry.get(rendererType) : null;
    const content = renderer
      ? entities.map((entity) => renderer.toJSON(entity))
      : entities;

    return {
      type: "group",
      content: {
        header: groupHeader,
        entities: content,
      },
      annotation: annotation?.text,
    };
  }
}
