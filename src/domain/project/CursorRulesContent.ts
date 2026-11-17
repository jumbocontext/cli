/**
 * Domain Value Object: Cursor Rules Content
 *
 * Asset-backed compatibility helper for .cursor/rules/jumbo.mdc content.
 */

import { AgentFileAssetContent } from "./AgentFileAssetContent.js";

export class CursorRulesContent {
  private static readonly SECTION_MARKER = "<!-- jumbo:cursor-rules -->";

  /**
   * Generate full .cursor/rules/jumbo.mdc content with YAML frontmatter
   * and a reference to JUMBO.md.
   */
  static getFullContent(): string {
    return AgentFileAssetContent.readMarkdown("cursor-rules.mdc");
  }

  /**
   * Marker used to detect if Jumbo section already exists in the rules file.
   */
  static getSectionMarker(): string {
    return this.SECTION_MARKER;
  }

  /**
   * Replace the Jumbo section in an existing rules file with the current content.
   * Finds the section marker and replaces everything from there to EOF
   * with the current section content.
   *
   * @returns Updated content, or null if marker not found
   */
  static replaceSection(existingContent: string): string | null {
    const markerIndex = existingContent.indexOf(this.SECTION_MARKER);

    if (markerIndex === -1) return null;

    const before = existingContent.substring(0, markerIndex);

    return (
      before +
      AgentFileAssetContent.extractSection(
        this.getFullContent(),
        this.SECTION_MARKER,
      )
    );
  }
}
