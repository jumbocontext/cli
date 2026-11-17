import { Section } from "../Section.js";
import { TerminalOutput } from "../TerminalOutput.js";
import { EntityRendererRegistry } from "./EntityRendererRegistry.js";

/**
 * Renders TerminalOutput as human-readable terminal text.
 * Applies formatting, colors, and entity-specific rendering.
 */
export class HumanReadableRenderer {
  constructor(private readonly registry: EntityRendererRegistry) {}

  render(output: TerminalOutput): string {
    const sections = output.getSections();
    const rendered = sections.map((section) => this.renderSection(section));
    return rendered.join("\n\n");
  }

  private renderSection(section: Section): string {
    switch (section.type) {
      case "prompt":
        return this.renderPrompt(section.content as string);

      case "data":
        return this.renderData(section);

      case "annotation":
        return this.renderAnnotation(section);

      case "group":
        return this.renderGroup(section);

      default:
        return "";
    }
  }

  private renderPrompt(text: string): string {
    // TODO: Apply formatting/colors for prompt sections
    return text;
  }

  private renderData(section: Section): string {
    // TODO: Implement data rendering with optional annotation
    const annotation = section.metadata?.annotation;
    const content = JSON.stringify(section.content, null, 2);

    if (annotation) {
      return `${annotation.text}\n${content}`;
    }

    return content;
  }

  private renderAnnotation(section: Section): string {
    const annotation = section.content as { type: string; text: string };
    // TODO: Apply formatting based on annotation type
    return annotation.text;
  }

  private renderGroup(section: Section): string {
    const { groupHeader, annotation, rendererType } = section.metadata || {};
    const entities = section.content as unknown[];

    const parts: string[] = [];

    // Add group header if present
    if (groupHeader) {
      parts.push(groupHeader);
    }

    // Add group annotation if present
    if (annotation) {
      parts.push(annotation.text);
    }

    // Render each entity using appropriate renderer
    const renderer = rendererType ? this.registry.get(rendererType) : null;

    if (renderer) {
      const renderedEntities = entities.map((entity) =>
        renderer.toHumanReadable(entity),
      );
      parts.push(...renderedEntities);
    } else {
      // Fallback: JSON stringify
      parts.push(JSON.stringify(entities, null, 2));
    }

    return parts.join("\n");
  }
}
