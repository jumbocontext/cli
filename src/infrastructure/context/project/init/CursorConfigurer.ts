/**
 * Infrastructure: Cursor Configurer
 *
 * Encapsulates all knowledge about Cursor configuration:
 * - .cursor/rules/jumbo.mdc with YAML frontmatter (alwaysApply: true) referencing JUMBO.md
 * - .cursor/hooks.json with Cursor-native sessionStart hook
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { CursorRulesContent } from "../../../../domain/project/CursorRulesContent.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

/**
 * Minimal shapes for the Cursor hooks document. Jumbo's own fragment matches
 * these exactly; external (user-authored) hook files are validated with runtime
 * guards and narrowed to these shapes once, at the parse boundary.
 */
interface CursorHook {
  command?: string;
  timeout?: number;
}

interface CursorHooksDocument {
  version?: number;
  hooks?: Record<string, CursorHook[]>;
}

export class CursorConfigurer implements IConfigurer {
  readonly agent = {
    id: "cursor",
    name: "Cursor",
  } as const;

  readonly skillPlatforms = [] as const;

  /**
   * Configure all Cursor requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCursorRules(projectRoot);
    await this.ensureCursorHooks(projectRoot);
  }

  /**
   * Ensure .cursor/rules/jumbo.mdc exists with YAML frontmatter and JUMBO.md reference
   */
  private async ensureCursorRules(projectRoot: string): Promise<void> {
    const rulesPath = path.join(projectRoot, ".cursor", "rules", "jumbo.mdc");

    try {
      await fs.ensureDir(path.join(projectRoot, ".cursor", "rules"));

      const exists = await fs.pathExists(rulesPath);

      if (!exists) {
        await fs.writeFile(
          rulesPath,
          CursorRulesContent.getFullContent(),
          "utf-8",
        );
        return;
      }

      const content = await fs.readFile(rulesPath, "utf-8");

      if (!content.includes(CursorRulesContent.getSectionMarker())) {
        const updatedContent =
          content.trimEnd() + "\n\n" + CursorRulesContent.getFullContent();
        await fs.writeFile(rulesPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to update .cursor/rules/jumbo.mdc: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure Cursor hooks are configured in .cursor/hooks.json
   */
  private async ensureCursorHooks(projectRoot: string): Promise<void> {
    try {
      const hooksPath = path.join(projectRoot, ".cursor", "hooks.json");

      await fs.ensureDir(path.join(projectRoot, ".cursor"));

      const jumboHooks = AgentFileAssetContent.readJson<CursorHooksDocument>(
        "cursor-hooks.fragment.json",
      );

      const exists = await fs.pathExists(hooksPath);

      if (!exists) {
        await fs.writeFile(
          hooksPath,
          JSON.stringify(jumboHooks, null, 2) + "\n",
          "utf-8",
        );
        return;
      }

      const existingContent = await fs.readFile(hooksPath, "utf-8");
      let existingHooks = {};

      if (existingContent.trim()) {
        try {
          existingHooks = JSON.parse(existingContent);
        } catch {
          await fs.writeFile(
            hooksPath,
            JSON.stringify(jumboHooks, null, 2) + "\n",
            "utf-8",
          );
          return;
        }
      }

      const normalizedExistingHooks =
        this.normalizeExistingHooks(existingHooks);
      const mergedHooks = this.mergeHooks(normalizedExistingHooks, jumboHooks);
      await fs.writeFile(
        hooksPath,
        JSON.stringify(mergedHooks, null, 2) + "\n",
        "utf-8",
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure Cursor hooks: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Merge hooks, preserving existing content and adding missing Jumbo hooks
   */
  private mergeHooks(
    existing: CursorHooksDocument,
    jumbo: CursorHooksDocument,
  ): CursorHooksDocument {
    const result: CursorHooksDocument = { ...existing };

    if (jumbo.version !== undefined) {
      result.version = jumbo.version;
    }

    if (jumbo.hooks) {
      const mergedHooks: Record<string, CursorHook[]> = {
        ...(result.hooks ?? {}),
      };

      for (const [hookType, hooks] of Object.entries(jumbo.hooks)) {
        if (hooks && Array.isArray(hooks)) {
          const existingHooks = mergedHooks[hookType] ?? [];
          mergedHooks[hookType] = this.mergeHookArray(existingHooks, hooks);
        }
      }

      result.hooks = mergedHooks;
    }

    return result;
  }

  /**
   * Merge hook arrays, deduplicating by command content
   */
  private mergeHookArray(
    existing: CursorHook[],
    additions: CursorHook[],
  ): CursorHook[] {
    const merged = [...existing];
    const existingCommands = new Set(existing.map((h) => JSON.stringify(h)));

    for (const addition of additions) {
      const additionKey = JSON.stringify(addition);
      if (!existingCommands.has(additionKey)) {
        merged.push(addition);
        existingCommands.add(additionKey);
      }
    }

    return merged;
  }

  /**
   * Normalize existing hook entries to Cursor's schema and remove stale
   * Jumbo preCompact hooks when no resume trigger exists in Cursor.
   */
  private normalizeExistingHooks(existing: unknown): CursorHooksDocument {
    if (!existing || typeof existing !== "object") {
      return {};
    }

    const source = existing as Record<string, unknown>;
    const result = { ...source } as CursorHooksDocument;
    const rawHooks = source.hooks;
    if (!rawHooks || typeof rawHooks !== "object") {
      return result;
    }

    const normalizedHooks: Record<string, CursorHook[]> = {};
    for (const [hookType, hookEntries] of Object.entries(rawHooks)) {
      if (!Array.isArray(hookEntries)) {
        continue;
      }

      const normalizedEntries = hookEntries
        .map((entry) => this.normalizeHookEntry(entry))
        .filter((entry): entry is CursorHook => entry !== null)
        .filter(
          (entry) =>
            !(hookType === "preCompact" && this.isJumboPauseHook(entry)),
        );

      if (normalizedEntries.length > 0) {
        normalizedHooks[hookType] = normalizedEntries;
      }
    }

    result.hooks = normalizedHooks;
    return result;
  }

  private normalizeHookEntry(entry: unknown): CursorHook | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.command === "string" && candidate.command.length > 0) {
      return candidate as CursorHook;
    }

    if (typeof candidate.bash === "string" && candidate.bash.length > 0) {
      const normalized: CursorHook = { command: candidate.bash };
      if (typeof candidate.timeoutSec === "number") {
        normalized.timeout = candidate.timeoutSec;
      }
      return normalized;
    }

    return null;
  }

  private isJumboPauseHook(entry: CursorHook): boolean {
    return entry.command === "jumbo work pause";
  }

  /**
   * Repair Cursor configuration by replacing stale content
   */
  async repair(projectRoot: string): Promise<void> {
    await this.repairCursorRules(projectRoot);
    await this.ensureCursorHooks(projectRoot);
  }

  /**
   * Repair .cursor/rules/jumbo.mdc by replacing the Jumbo section with current content
   */
  private async repairCursorRules(projectRoot: string): Promise<void> {
    const rulesPath = path.join(projectRoot, ".cursor", "rules", "jumbo.mdc");

    try {
      await fs.ensureDir(path.join(projectRoot, ".cursor", "rules"));

      const exists = await fs.pathExists(rulesPath);

      if (!exists) {
        await fs.writeFile(
          rulesPath,
          CursorRulesContent.getFullContent(),
          "utf-8",
        );
        return;
      }

      const content = await fs.readFile(rulesPath, "utf-8");
      const replaced = CursorRulesContent.replaceSection(content);

      if (replaced !== null) {
        await fs.writeFile(rulesPath, replaced, "utf-8");
      } else if (!content.includes("JUMBO.md")) {
        const updatedContent =
          content.trimEnd() + "\n\n" + CursorRulesContent.getFullContent();
        await fs.writeFile(rulesPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to repair .cursor/rules/jumbo.mdc: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    const rulesPath = path.join(projectRoot, ".cursor", "rules", "jumbo.mdc");
    changes.push({
      path: ".cursor/rules/jumbo.mdc",
      action: (await fs.pathExists(rulesPath)) ? "modify" : "create",
      description: "Add Jumbo instructions with alwaysApply frontmatter",
    });

    const hooksPath = path.join(projectRoot, ".cursor", "hooks.json");
    changes.push({
      path: ".cursor/hooks.json",
      action: (await fs.pathExists(hooksPath)) ? "modify" : "create",
      description: "Add Cursor-compatible sessionStart hook",
    });

    return changes;
  }
}
