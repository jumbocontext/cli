/**
 * Domain Value Object: Copilot Instructions Content
 *
 * Asset-backed compatibility helper for copilot-instructions.md content.
 */

import { AgentFileAssetContent } from "./AgentFileAssetContent.js";

export class CopilotInstructionsContent {
  /**
   * Generate thin reference content for copilot-instructions.md
   */
  static getCopilotInstructions(): string {
    return AgentFileAssetContent.readMarkdown("copilot-instructions.md");
  }

  /**
   * Generate the Jumbo section without the file title.
   */
  static getCopilotSection(): string {
    return AgentFileAssetContent.extractSection(
      this.getCopilotInstructions(),
      this.getCopilotSectionMarker(),
    );
  }

  /**
   * Marker used to detect if Jumbo section already exists in copilot-instructions.md
   */
  static getCopilotSectionMarker(): string {
    return "## Instructions for Agents on how to collaborate with Jumbo";
  }

  /**
   * Legacy marker from the previous verbose Copilot instructions.
   */
  private static getLegacyCopilotSectionMarker(): string {
    return "## Jumbo Context Management";
  }

  /**
   * Replace the Copilot section in copilot-instructions.md with the current thin reference.
   * Finds current or legacy section marker and replaces everything from there
   * to the next "## " heading (or EOF) with current thin reference section.
   *
   * @returns Updated content, or null if no marker found
   */
  static replaceCopilotSection(existingContent: string): string | null {
    const allMarkers = [
      this.getCopilotSectionMarker(),
      this.getLegacyCopilotSectionMarker(),
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

    return before + this.getCopilotSection() + after;
  }
}
