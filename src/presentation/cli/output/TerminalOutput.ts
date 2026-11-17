import { Section } from "./Section.js";
import { HookOutput } from "./HookOutput.js";

/**
 * Format-agnostic terminal output structure.
 * Can be rendered as human-readable text or strict JSON for hooks.
 */
export class TerminalOutput {
  constructor(private readonly sections: Section[]) {}

  getSections(): readonly Section[] {
    return this.sections;
  }

  /**
   * Render as human-readable terminal output with formatting, colors, etc.
   *
   * For now, this simply concatenates prompt sections.
   * In future iterations, this could use HumanReadableRenderer for more sophisticated formatting.
   */
  toHumanReadable(): string {
    return this.sections
      .map((section) => {
        if (section.type === "prompt") {
          return section.content as string;
        }
        if (
          section.type === "data" &&
          section.content &&
          typeof section.content === "object"
        ) {
          const data = section.content as Record<string, unknown>;
          if (data.message) {
            return String(data.message);
          }
        }
        return "";
      })
      .filter((s) => s.length > 0)
      .join("\n\n");
  }

  /**
   * Render as strict JSON for hook integration.
   * No stdout pollution - pure JSON only.
   */
  toJSON(): HookOutput {
    return {
      decision: "allow",
      promptSections: this.sections.map((section) => ({
        type: section.type,
        content: section.content,
        annotation: section.metadata?.annotation?.text,
      })),
    };
  }
}
