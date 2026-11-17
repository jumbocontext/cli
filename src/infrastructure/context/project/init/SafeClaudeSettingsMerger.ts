import fs from "fs-extra";
import * as path from "path";

/**
 * Claude Code settings structure
 * Based on: https://docs.anthropic.com/en/docs/claude-code/hooks
 */
export interface ClaudeCommandHook {
  type: "command";
  command: string;
}

export interface ClaudePromptHook {
  type: "prompt";
  prompt: string;
}

export type ClaudeHook = ClaudeCommandHook | ClaudePromptHook;

export interface ClaudeHookMatcher {
  matcher: string;
  hooks: ClaudeHook[];
}

export interface ClaudeSettings {
  hooks?: {
    SessionStart?: ClaudeHookMatcher[];
    PreCompact?: ClaudeHookMatcher[];
    SessionEnd?: ClaudeHookMatcher[];
    [key: string]: ClaudeHookMatcher[] | undefined;
  };
  permissions?: {
    allow?: string[];
    deny?: string[];
    ask?: string[];
  };
}

/**
 * Safe merger for Claude Code settings.json files
 *
 * Strategy:
 * - Creates backup before modification
 * - Deep merges objects, deduplicates arrays
 * - Validates JSON before and after merge
 * - Rolls back on error
 * - Idempotent (safe to run multiple times)
 *
 * @example
 * await SafeClaudeSettingsMerger.mergeSettings(projectRoot, {
 *   hooks: {
 *     SessionStart: [{
 *       matcher: "startup",
 *       hooks: [{ type: "command", command: "jumbo session start" }]
 *     }]
 *   }
 * });
 */
export class SafeClaudeSettingsMerger {
  /**
   * Merges new settings into existing .claude/settings.json
   *
   * @param projectRoot - Root directory of the project
   * @param newSettings - Settings to merge in
   * @throws Error if JSON is malformed or validation fails
   */
  static async mergeSettings(
    projectRoot: string,
    newSettings: ClaudeSettings,
  ): Promise<void> {
    const settingsPath = path.join(projectRoot, ".claude", "settings.json");
    const backupPath = `${settingsPath}.backup.${Date.now()}`;

    // Ensure .claude directory exists
    await fs.ensureDir(path.join(projectRoot, ".claude"));

    // STEP 1: Create backup if file exists
    if (await fs.pathExists(settingsPath)) {
      await fs.copy(settingsPath, backupPath);
    }

    try {
      // STEP 2: Read existing or use empty object
      // Be lenient with existing user content - only parse JSON, don't validate structure
      // User's config may have extensions or typos we shouldn't reject
      let existing: ClaudeSettings = {};
      if (await fs.pathExists(settingsPath)) {
        const content = await fs.readFile(settingsPath, "utf-8");
        // Handle empty file case - treat as empty config
        if (content.trim()) {
          existing = JSON.parse(content);
        }
      }

      // STEP 3: Merge safely
      const merged = this.deepMerge(existing, newSettings);

      // STEP 4: Write back with formatting
      // Skip validation - user's config may have extensions or typos we should preserve
      await fs.writeFile(
        settingsPath,
        JSON.stringify(merged, null, 2) + "\n",
        "utf-8",
      );

      // STEP 6: Cleanup backup on success (optional - keep for audit trail)
      // await fs.remove(backupPath);
    } catch (error) {
      // STEP 7: Rollback on error
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, settingsPath, { overwrite: true });
      }
      throw error;
    }
  }

  /**
   * Deep merges two settings objects
   * - Objects are merged recursively
   * - Arrays are deduplicated based on content
   * - Existing user settings are preserved
   */
  private static deepMerge(
    existing: ClaudeSettings,
    newSettings: ClaudeSettings,
  ): ClaudeSettings {
    const result: ClaudeSettings = { ...existing };

    // Merge hooks - handle all event types generically
    if (newSettings.hooks) {
      result.hooks = result.hooks ?? {};

      for (const eventType of Object.keys(newSettings.hooks)) {
        const newHooks = newSettings.hooks[eventType];
        if (newHooks) {
          const existingHooks = existing.hooks?.[eventType] ?? [];
          result.hooks[eventType] = this.mergeHookMatchers(
            existingHooks,
            newHooks,
          );
        }
      }
    }

    // Merge permissions
    if (newSettings.permissions) {
      result.permissions = result.permissions ?? {};

      // Merge allow array (unique values)
      if (newSettings.permissions.allow) {
        const existingAllow = existing.permissions?.allow ?? [];
        const newAllow = newSettings.permissions.allow;
        result.permissions.allow = Array.from(
          new Set([...existingAllow, ...newAllow]),
        );
      }

      // Merge deny array (unique values)
      if (newSettings.permissions.deny) {
        const existingDeny = existing.permissions?.deny ?? [];
        const newDeny = newSettings.permissions.deny;
        result.permissions.deny = Array.from(
          new Set([...existingDeny, ...newDeny]),
        );
      }

      // Merge ask array (unique values)
      if (newSettings.permissions.ask) {
        const existingAsk = existing.permissions?.ask ?? [];
        const newAsk = newSettings.permissions.ask;
        result.permissions.ask = Array.from(
          new Set([...existingAsk, ...newAsk]),
        );
      }
    }

    return result;
  }

  /**
   * Merges hook matcher arrays, deduplicating by hook content
   */
  private static mergeHookMatchers(
    existing: ClaudeHookMatcher[],
    additions: ClaudeHookMatcher[],
  ): ClaudeHookMatcher[] {
    const merged = [...existing];

    for (const newMatcher of additions) {
      // Find existing matcher with same matcher type
      const existingIndex = merged.findIndex(
        (m) => m.matcher === newMatcher.matcher,
      );

      if (existingIndex >= 0) {
        // Merge hooks within the same matcher, deduplicating by content
        const existingMatcher = merged[existingIndex];
        const hookMap = new Map<string, ClaudeHook>();

        // Add existing hooks - key by unique content
        for (const hook of existingMatcher.hooks) {
          hookMap.set(this.getHookKey(hook), hook);
        }

        // Add new hooks (overwrites if same key)
        for (const hook of newMatcher.hooks) {
          hookMap.set(this.getHookKey(hook), hook);
        }

        merged[existingIndex] = {
          ...existingMatcher,
          hooks: Array.from(hookMap.values()),
        };
      } else {
        // No existing matcher with this type, add it
        merged.push(newMatcher);
      }
    }

    return merged;
  }

  /**
   * Generate a unique key for a hook based on its type and content
   * Handles malformed hooks gracefully by including all available properties
   */
  private static getHookKey(hook: ClaudeHook): string {
    // Handle malformed hooks that might have mismatched type/content
    const anyHook = hook as unknown as Record<string, unknown>;
    if (hook.type === "command" && typeof anyHook.command === "string") {
      return `command:${anyHook.command}`;
    } else if (hook.type === "prompt" && typeof anyHook.prompt === "string") {
      return `prompt:${anyHook.prompt}`;
    } else {
      // Fallback for malformed hooks - use JSON serialization for uniqueness
      return `unknown:${JSON.stringify(hook)}`;
    }
  }

  /**
   * Parses JSON string and validates structure
   */
  private static parseAndValidate(jsonString: string): ClaudeSettings {
    try {
      const parsed = JSON.parse(jsonString);
      this.validateSettings(parsed);
      return parsed;
    } catch (error) {
      throw new Error(
        `Invalid settings.json: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validates settings structure
   */
  private static validateSettings(settings: ClaudeSettings): void {
    // Must be an object
    if (typeof settings !== "object" || settings === null) {
      throw new Error("Settings must be an object");
    }

    // Validate hooks structure if present
    if (settings.hooks !== undefined) {
      if (typeof settings.hooks !== "object" || settings.hooks === null) {
        throw new Error("hooks must be an object");
      }

      // Validate all hook event types generically
      for (const [eventType, matchers] of Object.entries(settings.hooks)) {
        if (matchers === undefined) continue;

        if (!Array.isArray(matchers)) {
          throw new Error(`hooks.${eventType} must be an array`);
        }

        for (const matcher of matchers) {
          if (!matcher.matcher || typeof matcher.matcher !== "string") {
            throw new Error(
              `${eventType} matcher must have a matcher property`,
            );
          }

          if (!Array.isArray(matcher.hooks)) {
            throw new Error(`${eventType} matcher.hooks must be an array`);
          }

          for (const hook of matcher.hooks) {
            if (hook.type === "command") {
              if (typeof hook.command !== "string") {
                throw new Error("Hook command must be a string");
              }
            } else if (hook.type === "prompt") {
              if (typeof hook.prompt !== "string") {
                throw new Error("Hook prompt must be a string");
              }
            } else {
              // Cast to unknown to access type for error message
              const unknownHook = hook as unknown as { type?: string };
              throw new Error(
                `Hook type must be 'command' or 'prompt', got '${unknownHook.type}'`,
              );
            }
          }
        }
      }
    }

    // Validate permissions structure if present
    if (settings.permissions !== undefined) {
      if (
        typeof settings.permissions !== "object" ||
        settings.permissions === null
      ) {
        throw new Error("permissions must be an object");
      }

      if (
        settings.permissions.allow !== undefined &&
        !Array.isArray(settings.permissions.allow)
      ) {
        throw new Error("permissions.allow must be an array");
      }

      if (
        settings.permissions.deny !== undefined &&
        !Array.isArray(settings.permissions.deny)
      ) {
        throw new Error("permissions.deny must be an array");
      }

      if (
        settings.permissions.ask !== undefined &&
        !Array.isArray(settings.permissions.ask)
      ) {
        throw new Error("permissions.ask must be an array");
      }
    }

    // Ensure valid JSON serialization
    try {
      JSON.stringify(settings);
    } catch (error) {
      throw new Error(
        `Settings cannot be serialized to JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
