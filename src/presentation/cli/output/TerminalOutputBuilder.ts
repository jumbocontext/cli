import { Section } from "./Section.js";
import { PromptSection } from "./PromptSection.js";
import { DataSection } from "./DataSection.js";
import { GroupSection } from "./GroupSection.js";
import { Annotation } from "./Annotation.js";
import { AnnotationType } from "./AnnotationType.js";
import { TerminalOutput } from "./TerminalOutput.js";

/**
 * Fluent builder for composing terminal output.
 * Produces format-agnostic TerminalOutput that can render as text or JSON.
 */
export class TerminalOutputBuilder {
  private sections: Section[] = [];

  /**
   * Add a prompt section (opening, closing, or contextual prompt text)
   */
  addPrompt(text: string): this {
    const section: PromptSection = {
      type: "prompt",
      content: text,
    };
    this.sections.push(section);
    return this;
  }

  /**
   * Add a data section (single entity or value)
   */
  addData(content: unknown, annotation?: Annotation): this {
    const section: DataSection = {
      type: "data",
      content,
      metadata: annotation ? { annotation } : undefined,
    };
    this.sections.push(section);
    return this;
  }

  /**
   * Add a standalone annotation section
   */
  addAnnotation(type: AnnotationType, text: string): this {
    this.sections.push({
      type: "annotation",
      content: { type, text },
    });
    return this;
  }

  /**
   * Add a group of related entities with optional header and annotations
   */
  addGroup(
    entities: unknown[],
    rendererType: string,
    options?: {
      groupHeader?: string;
      annotation?: Annotation;
    },
  ): this {
    const section: GroupSection = {
      type: "group",
      content: entities,
      metadata: {
        rendererType,
        groupHeader: options?.groupHeader,
        annotation: options?.annotation,
      },
    };
    this.sections.push(section);
    return this;
  }

  /**
   * Build the final format-agnostic output
   */
  build(): TerminalOutput {
    return new TerminalOutput(this.sections);
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): this {
    this.sections = [];
    return this;
  }
}
