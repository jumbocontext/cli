/**
 * Domain Value Object: JUMBO.md Content
 *
 * Asset-backed compatibility helper for JUMBO.md content.
 */

import { AgentFileAssetContent } from "./AgentFileAssetContent.js";

export class JumboMdContent {
  /**
   * Generate the Jumbo instructions section for JUMBO.md
   */
  static getJumboSection(): string {
    return AgentFileAssetContent.extractSection(
      AgentFileAssetContent.readMarkdown("JUMBO.md"),
      this.getCurrentSectionMarker(),
    );
  }

  /**
   * Generate complete JUMBO.md file content
   */
  static getFullContent(): string {
    return AgentFileAssetContent.readMarkdown("JUMBO.md");
  }

  /**
   * The current section heading extracted from getJumboSection().
   */
  static getCurrentSectionMarker(): string {
    return "## Instructions for Agents on how to collaborate with Jumbo";
  }

  /**
   * All historically used section headings for the Jumbo section.
   * Carried over from AgentsMdContent legacy markers.
   * When the current heading changes, add the previous heading here
   * so that repair/init can find and replace old installations.
   */
  static getLegacySectionMarkers(): string[] {
    return ["## Instructions for Jumbo"];
  }

  /**
   * Replace the Jumbo section in JUMBO.md with the current version.
   * Checks the current marker and all legacy markers to find the section,
   * then replaces everything from the matched marker to the next "## " heading
   * (or EOF) with current getJumboSection().
   *
   * @returns Updated content, or null if no marker found
   */
  static replaceJumboSection(existingContent: string): string | null {
    const allMarkers = [
      this.getCurrentSectionMarker(),
      ...this.getLegacySectionMarkers(),
    ];

    let matchedMarker: string | null = null;
    let markerIndex = -1;

    for (const marker of allMarkers) {
      const index = existingContent.indexOf(marker);
      if (index !== -1) {
        matchedMarker = marker;
        markerIndex = index;
        break;
      }
    }

    if (matchedMarker === null || markerIndex === -1) return null;

    // Find the next ## heading after the marker (or EOF)
    const afterMarker = existingContent.substring(
      markerIndex + matchedMarker.length,
    );
    const nextHeadingMatch = afterMarker.match(/\n## /);
    const endIndex = nextHeadingMatch
      ? markerIndex + matchedMarker.length + nextHeadingMatch.index!
      : existingContent.length;

    const before = existingContent.substring(0, markerIndex);
    const after = existingContent.substring(endIndex);

    return before + this.getJumboSection() + after;
  }
}
