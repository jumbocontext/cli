/**
 * Infrastructure: Filesystem Gitignore Protocol Implementation
 *
 * Ensures .gitignore contains exclusion patterns for Jumbo's internal
 * state files. Respects existing user customizations by never modifying
 * lines that already reference the target patterns.
 *
 * Operations are idempotent and gracefully handle errors to avoid
 * failing project initialization if file writes fail.
 */

import path from "node:path";
import fs from "node:fs";
import { IGitignoreProtocol } from "../../../../application/context/project/init/IGitignoreProtocol.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

const EXCLUSION_PATTERNS = [".jumbo/", ".jumbo/jumbo.db"] as const;

export class FsGitignoreProtocol implements IGitignoreProtocol {
  async ensureExclusions(projectRoot: string): Promise<void> {
    const gitignorePath = path.join(projectRoot, ".gitignore");

    try {
      let content: string;
      let fileExists: boolean;

      try {
        content = fs.readFileSync(gitignorePath, "utf-8");
        fileExists = true;
      } catch {
        content = "";
        fileExists = false;
      }

      const missingPatterns = this.findMissingPatterns(content);

      if (missingPatterns.length === 0) {
        return;
      }

      const newContent = fileExists
        ? this.appendPatterns(content, missingPatterns)
        : missingPatterns.join("\n") + "\n";

      fs.writeFileSync(gitignorePath, newContent, "utf-8");
    } catch (error) {
      console.warn(
        `Warning: Failed to update .gitignore: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const gitignorePath = path.join(projectRoot, ".gitignore");

    let content: string;
    let fileExists: boolean;

    try {
      content = fs.readFileSync(gitignorePath, "utf-8");
      fileExists = true;
    } catch {
      content = "";
      fileExists = false;
    }

    const missingPatterns = this.findMissingPatterns(content);

    if (missingPatterns.length === 0) {
      return [];
    }

    return [
      {
        path: ".gitignore",
        action: fileExists ? "modify" : "create",
        description: "Exclude Jumbo internal state from version control",
      },
    ];
  }

  private findMissingPatterns(content: string): string[] {
    const lines = content.split("\n");
    return EXCLUSION_PATTERNS.filter(
      (pattern) =>
        !lines.some((line) => this.lineMatchesPattern(line, pattern)),
    );
  }

  private lineMatchesPattern(line: string, pattern: string): boolean {
    const trimmed = line.trim();
    // Match active, negated (!), or commented (#) patterns
    // Strip leading !, #, /, and whitespace to find the core pattern
    const normalized = trimmed.replace(/^[!#/\s]+/, "");
    return normalized === pattern || normalized === pattern.replace(/\/$/, "");
  }

  private appendPatterns(existingContent: string, patterns: string[]): string {
    const endsWithNewline = existingContent.endsWith("\n");
    const separator = endsWithNewline ? "\n" : "\n\n";
    return existingContent + separator + patterns.join("\n") + "\n";
  }
}
