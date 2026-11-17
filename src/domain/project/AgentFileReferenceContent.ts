/**
 * Domain Value Object: Agent File Reference Content
 *
 * Asset-backed compatibility helper for CLAUDE.md and GEMINI.md content.
 */

import { AgentFileAssetContent } from "./AgentFileAssetContent.js";

export class AgentFileReferenceContent {
  /**
   * Generate thin reference content for agent files (CLAUDE.md, GEMINI.md)
   * parameterized by filename.
   */
  static getAgentFileReference(fileName: string): string {
    return AgentFileAssetContent.readMarkdown(fileName);
  }

  /**
   * Replace legacy agent file reference content with the new thin reference.
   * Detects the legacy "CRITICAL STARTUP INSTRUCTION:" marker and replaces
   * the entire file content with the new reference.
   *
   * @returns Updated content, or null if legacy marker not found
   */
  static replaceAgentFileReference(
    existingContent: string,
    fileName: string,
  ): string | null {
    const legacyMarker = "CRITICAL STARTUP INSTRUCTION:";

    if (existingContent.indexOf(legacyMarker) === -1) return null;

    return this.getAgentFileReference(fileName);
  }
}
