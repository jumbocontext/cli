import fs from "fs-extra";
import path from "path";

export interface AntigravityHookHandler {
  type?: "command";
  command: string;
  timeout?: number;
}

export interface AntigravityToolHookMatcher {
  matcher: string;
  hooks: AntigravityHookHandler[];
}

export interface AntigravityHookDefinition {
  enabled?: boolean;
  PreToolUse?: AntigravityToolHookMatcher[];
  PostToolUse?: AntigravityToolHookMatcher[];
  PreInvocation?: AntigravityHookHandler[];
  PostInvocation?: AntigravityHookHandler[];
  Stop?: AntigravityHookHandler[];
  [eventName: string]:
    | boolean
    | AntigravityToolHookMatcher[]
    | AntigravityHookHandler[]
    | undefined;
}

export type AntigravityHooksDocument = Record<
  string,
  AntigravityHookDefinition
>;

export class SafeAntigravityHooksMerger {
  /**
   * Merges Jumbo-managed hook definitions into .agents/hooks.json.
   *
   * Existing user hook definitions and unknown fields are preserved. Hook handlers
   * are deduplicated by command content, so repeated init or repair remains idempotent.
   */
  static async mergeHooks(
    projectRoot: string,
    newHooks: AntigravityHooksDocument,
  ): Promise<void> {
    const hooksPath = path.join(projectRoot, ".agents", "hooks.json");
    const backupPath = `${hooksPath}.backup.${Date.now()}`;

    await fs.ensureDir(path.join(projectRoot, ".agents"));

    if (await fs.pathExists(hooksPath)) {
      await fs.copy(hooksPath, backupPath);
    }

    try {
      let existing: AntigravityHooksDocument = {};
      if (await fs.pathExists(hooksPath)) {
        const content = await fs.readFile(hooksPath, "utf-8");
        if (content.trim()) {
          existing = JSON.parse(content);
        }
      }

      const merged = this.mergeDocuments(existing, newHooks);
      await fs.writeFile(
        hooksPath,
        JSON.stringify(merged, null, 2) + "\n",
        "utf-8",
      );
    } catch (error) {
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, hooksPath, { overwrite: true });
      }
      throw error;
    }
  }

  private static mergeDocuments(
    existing: AntigravityHooksDocument,
    additions: AntigravityHooksDocument,
  ): AntigravityHooksDocument {
    const merged: AntigravityHooksDocument = { ...existing };

    for (const [hookName, hookDefinition] of Object.entries(additions)) {
      merged[hookName] = this.mergeHookDefinition(
        merged[hookName],
        hookDefinition,
      );
    }

    return merged;
  }

  private static mergeHookDefinition(
    existing: AntigravityHookDefinition | undefined,
    addition: AntigravityHookDefinition,
  ): AntigravityHookDefinition {
    if (existing === undefined) {
      return addition;
    }

    const merged: AntigravityHookDefinition = { ...existing };

    if (addition.enabled !== undefined) {
      merged.enabled = existing.enabled ?? addition.enabled;
    }

    for (const eventName of Object.keys(addition)) {
      if (eventName === "enabled") {
        continue;
      }

      const additionValue = addition[eventName];
      if (!Array.isArray(additionValue)) {
        continue;
      }

      const existingValue = existing[eventName];
      if (this.isToolMatcherEvent(eventName)) {
        merged[eventName] = this.mergeToolHookMatchers(
          Array.isArray(existingValue)
            ? (existingValue as readonly AntigravityToolHookMatcher[])
            : [],
          additionValue as readonly AntigravityToolHookMatcher[],
        );
      } else {
        merged[eventName] = this.mergeHookHandlers(
          Array.isArray(existingValue)
            ? (existingValue as readonly AntigravityHookHandler[])
            : [],
          additionValue as readonly AntigravityHookHandler[],
        );
      }
    }

    return merged;
  }

  private static mergeToolHookMatchers(
    existing: readonly AntigravityToolHookMatcher[],
    additions: readonly AntigravityToolHookMatcher[],
  ): AntigravityToolHookMatcher[] {
    const merged = [...existing];

    for (const addition of additions) {
      const existingIndex = merged.findIndex(
        (matcher) => matcher.matcher === addition.matcher,
      );

      if (existingIndex === -1) {
        merged.push(addition);
        continue;
      }

      const existingMatcher = merged[existingIndex];
      merged[existingIndex] = {
        ...existingMatcher,
        hooks: this.mergeHookHandlers(existingMatcher.hooks, addition.hooks),
      };
    }

    return merged;
  }

  private static mergeHookHandlers(
    existing: readonly AntigravityHookHandler[],
    additions: readonly AntigravityHookHandler[],
  ): AntigravityHookHandler[] {
    const handlersByKey = new Map<string, AntigravityHookHandler>();

    for (const handler of existing) {
      handlersByKey.set(this.getHandlerKey(handler), handler);
    }

    for (const handler of additions) {
      handlersByKey.set(this.getHandlerKey(handler), handler);
    }

    return Array.from(handlersByKey.values());
  }

  private static isToolMatcherEvent(eventName: string): boolean {
    return eventName === "PreToolUse" || eventName === "PostToolUse";
  }

  private static getHandlerKey(handler: AntigravityHookHandler): string {
    return `${handler.type ?? "command"}:${handler.command}`;
  }
}
