/**
 * Infrastructure: OpenAI Codex Configurer
 *
 * Encapsulates all knowledge about OpenAI Codex configuration:
 * - .codex/hooks.json with Codex lifecycle hooks
 * - Skills distributed to .agents/skills
 * - Cleanup of obsolete Jumbo-managed skill copies under .codex/skills
 *
 * Codex reads AGENTS.md natively, so no instruction file is needed.
 * Codex reads repo skills from .agents/skills and repo hooks from
 * the trusted project .codex configuration layer.
 * Codex 0.153.4 treats stdout starting with { or [ as hook-control JSON.
 * PreCompact uses quiet text to omit the non-TTY [OK] success prefix.
 * SessionStart keeps full text so startup and compact-resume context is delivered.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import {
  applyEdits,
  modify,
  parse,
  type FormattingOptions,
  type ParseError,
} from "jsonc-parser";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";

/**
 * Minimal shapes for the Codex hooks document. Jumbo's own fragment matches
 * these exactly; external (user-authored) hook files are validated with runtime
 * guards and narrowed to these shapes once, at the parse boundary.
 */
interface CodexHookCommand {
  type?: string;
  command?: string;
}

interface CodexMatcherGroup {
  matcher?: string;
  hooks?: CodexHookCommand[];
}

interface CodexHooksDocument {
  hooks?: Record<string, CodexMatcherGroup[]>;
}

const JSON_FORMATTING_OPTIONS: FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};
const STALE_JUMBO_COMMAND_REPLACEMENTS: Readonly<Record<string, string>> = {
  "jumbo session start": "jumbo session start --format text",
  "jumbo work resume": "jumbo work resume --format text",
  "jumbo work pause": "jumbo work pause --format text --quiet",
  "jumbo work pause --format text": "jumbo work pause --format text --quiet",
};
const OBSOLETE_CODEX_SKILLS_RELATIVE_PATH = ".codex/skills";

export class CodexConfigurer implements IConfigurer {
  readonly agent = {
    id: "codex",
    name: "Codex",
  } as const;

  readonly skillPlatforms = [".agents/skills"] as const;

  constructor(private readonly templateSkillsRoot: string) {}

  /**
   * Configure all OpenAI Codex requirements for Jumbo.
   * Codex reads AGENTS.md natively; lifecycle hooks are configured
   * separately in .codex/hooks.json.
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCodexHooks(projectRoot);
    await this.removeObsoleteManagedSkillCopies(projectRoot);
  }

  /**
   * Repair Codex configuration by replacing stale Jumbo hook commands
   * and cleaning obsolete Jumbo-managed skill copies.
   */
  async repair(projectRoot: string): Promise<void> {
    await this.ensureCodexHooks(projectRoot);
    await this.removeObsoleteManagedSkillCopies(projectRoot);
  }

  private async ensureCodexHooks(projectRoot: string): Promise<void> {
    try {
      const hooksPath = path.join(projectRoot, ".codex", "hooks.json");
      await fs.ensureDir(path.join(projectRoot, ".codex"));

      const exists = await fs.pathExists(hooksPath);
      if (!exists) {
        await fs.writeFile(
          hooksPath,
          JSON.stringify(this.getJumboHooks(), null, 2) + "\n",
          "utf-8",
        );
        return;
      }

      const existingContent = await fs.readFile(hooksPath, "utf-8");
      const parseErrors: ParseError[] = [];
      const existingHooks = existingContent.trim()
        ? (parse(existingContent, parseErrors, {
            allowTrailingComma: true,
          }) as unknown)
        : {};

      if (parseErrors.length > 0 || !this.isJsonObject(existingHooks)) {
        await fs.writeFile(
          hooksPath,
          JSON.stringify(this.getJumboHooks(), null, 2) + "\n",
          "utf-8",
        );
        return;
      }

      const mergedContent = this.mergeJumboHooks(
        existingContent,
        existingHooks,
      );
      await fs.writeFile(
        hooksPath,
        this.ensureTrailingNewline(mergedContent),
        "utf-8",
      );
    } catch (error) {
      console.warn(
        `Warning: Failed to configure Codex hooks: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private mergeJumboHooks(
    existingContent: string,
    existingHooks: Record<string, unknown>,
  ): string {
    if (!existingContent.trim()) {
      return JSON.stringify(this.getJumboHooks(), null, 2);
    }

    const updatedContent = this.replaceStaleJumboCommandValues(
      existingContent,
      existingHooks,
    );
    const updatedHooks = this.parseCodexHooksDocument(updatedContent);
    return this.addMissingJumboHooks(updatedContent, updatedHooks ?? {});
  }

  private ensureTrailingNewline(content: string): string {
    return content.endsWith("\n") ? content : `${content}\n`;
  }

  private getJumboHooks(): CodexHooksDocument {
    return AgentFileAssetContent.readJson<CodexHooksDocument>(
      "codex-hooks.fragment.json",
    );
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  private replaceStaleJumboCommandValues(
    existingContent: string,
    existingHooks: Record<string, unknown>,
  ): string {
    const rawHooks = existingHooks.hooks;
    if (!this.isJsonObject(rawHooks)) {
      return existingContent;
    }

    let updatedContent = existingContent;
    for (const [eventName, matcherGroups] of Object.entries(rawHooks)) {
      if (!Array.isArray(matcherGroups)) {
        continue;
      }

      matcherGroups.forEach((matcherGroup, matcherGroupIndex) => {
        if (
          !this.isJsonObject(matcherGroup) ||
          !Array.isArray(matcherGroup.hooks)
        ) {
          return;
        }

        matcherGroup.hooks.forEach((hook, hookIndex) => {
          if (!this.isJsonObject(hook) || typeof hook.command !== "string") {
            return;
          }

          const replacement = STALE_JUMBO_COMMAND_REPLACEMENTS[hook.command];
          if (!replacement) {
            return;
          }

          updatedContent = this.applyJsoncEdit(
            updatedContent,
            [
              "hooks",
              eventName,
              matcherGroupIndex,
              "hooks",
              hookIndex,
              "command",
            ],
            replacement,
          );
        });
      });
    }

    return updatedContent;
  }

  private addMissingJumboHooks(
    existingContent: string,
    existingHooks: CodexHooksDocument,
  ): string {
    const jumboHooks = this.getJumboHooks();
    if (!this.isJsonObject(existingHooks.hooks)) {
      return this.applyJsoncEdit(
        existingContent,
        ["hooks"],
        jumboHooks.hooks ?? {},
      );
    }

    let updatedContent = existingContent;
    for (const [eventName, jumboMatcherGroups] of Object.entries(
      jumboHooks.hooks ?? {},
    )) {
      const currentHooks = this.parseCodexHooksDocument(updatedContent);
      const currentMatcherGroups = currentHooks?.hooks?.[eventName];
      if (!Array.isArray(currentMatcherGroups)) {
        updatedContent = this.applyJsoncEdit(
          updatedContent,
          ["hooks", eventName],
          jumboMatcherGroups,
        );
        continue;
      }

      for (const jumboMatcherGroup of jumboMatcherGroups) {
        updatedContent = this.addMissingJumboMatcherGroupHook(
          updatedContent,
          eventName,
          jumboMatcherGroup,
        );
      }
    }

    return updatedContent;
  }

  private addMissingJumboMatcherGroupHook(
    existingContent: string,
    eventName: string,
    jumboMatcherGroup: CodexMatcherGroup,
  ): string {
    const currentHooks = this.parseCodexHooksDocument(existingContent);
    const currentMatcherGroups = currentHooks?.hooks?.[eventName];
    if (!Array.isArray(currentMatcherGroups)) {
      return existingContent;
    }

    const matcherGroupIndex = currentMatcherGroups.findIndex(
      (matcherGroup) => matcherGroup.matcher === jumboMatcherGroup.matcher,
    );
    if (matcherGroupIndex === -1) {
      return this.applyJsoncEdit(
        existingContent,
        ["hooks", eventName, -1],
        jumboMatcherGroup,
      );
    }

    const currentMatcherGroup = currentMatcherGroups[matcherGroupIndex];
    if (!Array.isArray(currentMatcherGroup.hooks)) {
      return this.applyJsoncEdit(
        existingContent,
        ["hooks", eventName, matcherGroupIndex, "hooks"],
        jumboMatcherGroup.hooks ?? [],
      );
    }

    let updatedContent = existingContent;
    for (const jumboHook of jumboMatcherGroup.hooks ?? []) {
      const refreshedHooks = this.parseCodexHooksDocument(updatedContent);
      const refreshedHookArray =
        refreshedHooks?.hooks?.[eventName]?.[matcherGroupIndex]?.hooks;
      if (
        refreshedHookArray?.some((hook) =>
          this.hasSameHookCommand(hook, jumboHook),
        )
      ) {
        continue;
      }

      updatedContent = this.applyJsoncEdit(
        updatedContent,
        ["hooks", eventName, matcherGroupIndex, "hooks", -1],
        jumboHook,
      );
    }

    return updatedContent;
  }

  private hasSameHookCommand(
    existingHook: CodexHookCommand,
    jumboHook: CodexHookCommand,
  ): boolean {
    return (
      existingHook.type === jumboHook.type &&
      existingHook.command === jumboHook.command
    );
  }

  private parseCodexHooksDocument(content: string): CodexHooksDocument | null {
    const parseErrors: ParseError[] = [];
    const parsed = parse(content, parseErrors, {
      allowTrailingComma: true,
    }) as unknown;
    if (parseErrors.length > 0 || !this.isJsonObject(parsed)) {
      return null;
    }

    return parsed as CodexHooksDocument;
  }

  private applyJsoncEdit(
    content: string,
    pathSegments: (string | number)[],
    value: unknown,
  ): string {
    const edits = modify(content, pathSegments, value, {
      formattingOptions: JSON_FORMATTING_OPTIONS,
    });
    return applyEdits(content, edits);
  }

  /**
   * Remove Jumbo-managed skill copies from the obsolete .codex/skills
   * location now that Codex reads repo skills from .agents/skills.
   */
  private async removeObsoleteManagedSkillCopies(
    projectRoot: string,
  ): Promise<void> {
    const obsoleteCodexSkillsRoot = path.join(
      projectRoot,
      OBSOLETE_CODEX_SKILLS_RELATIVE_PATH,
    );
    if (!(await fs.pathExists(obsoleteCodexSkillsRoot))) {
      return;
    }

    for (const skillName of await this.getTemplateSkillNames()) {
      const templateSkillDirectory = path.join(
        this.templateSkillsRoot,
        skillName,
      );
      const obsoleteSkillDirectory = path.join(
        obsoleteCodexSkillsRoot,
        skillName,
      );
      if (
        await this.isObsoleteManagedSkillCopy(
          obsoleteSkillDirectory,
          templateSkillDirectory,
        )
      ) {
        try {
          await fs.remove(obsoleteSkillDirectory);
        } catch (error) {
          console.warn(
            `Warning: Failed to remove obsolete Codex managed skill '${skillName}': ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    await this.removeDirectoryIfEmpty(obsoleteCodexSkillsRoot);
  }

  private async getTemplateSkillNames(): Promise<string[]> {
    if (!(await fs.pathExists(this.templateSkillsRoot))) {
      return [];
    }

    const entries = await fs.readdir(this.templateSkillsRoot, {
      withFileTypes: true,
    });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  /**
   * A .codex skill copy is only considered Jumbo-managed (and safe to delete)
   * when its entire content is byte-identical to the current managed template:
   * every file matches and no extra entries exist. Any deviation — customized
   * bodies, extra user files, or unknown entry types — marks it user-owned.
   */
  private async isObsoleteManagedSkillCopy(
    skillDirectory: string,
    templateSkillDirectory: string,
  ): Promise<boolean> {
    try {
      if (
        !(await this.isDirectory(skillDirectory)) ||
        !(await this.isDirectory(templateSkillDirectory))
      ) {
        return false;
      }

      return await this.directoryContentMatchesManagedTemplate(
        skillDirectory,
        templateSkillDirectory,
      );
    } catch {
      return false;
    }
  }

  private async directoryContentMatchesManagedTemplate(
    directory: string,
    templateDirectory: string,
  ): Promise<boolean> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    if (entries.length === 0) {
      return false;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      const templateEntryPath = path.join(templateDirectory, entry.name);

      if (entry.isDirectory()) {
        if (
          !(await this.isDirectory(templateEntryPath)) ||
          !(await this.directoryContentMatchesManagedTemplate(
            entryPath,
            templateEntryPath,
          ))
        ) {
          return false;
        }
      } else if (entry.isFile()) {
        if (
          !(await this.fileContentMatchesManagedTemplate(
            entryPath,
            templateEntryPath,
          ))
        ) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  private async fileContentMatchesManagedTemplate(
    filePath: string,
    templateFilePath: string,
  ): Promise<boolean> {
    if (!(await this.isFile(templateFilePath))) {
      return false;
    }

    const [fileContent, templateFileContent] = await Promise.all([
      fs.readFile(filePath),
      fs.readFile(templateFilePath),
    ]);
    return fileContent.equals(templateFileContent);
  }

  private async isDirectory(directoryPath: string): Promise<boolean> {
    try {
      return (await fs.stat(directoryPath)).isDirectory();
    } catch {
      return false;
    }
  }

  private async isFile(filePath: string): Promise<boolean> {
    try {
      return (await fs.stat(filePath)).isFile();
    } catch {
      return false;
    }
  }

  private async removeDirectoryIfEmpty(directoryPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(directoryPath);
      if (entries.length === 0) {
        await fs.remove(directoryPath);
      }
    } catch {
      return;
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const hooksPath = path.join(projectRoot, ".codex", "hooks.json");

    return [
      {
        path: ".codex/hooks.json",
        action: (await fs.pathExists(hooksPath)) ? "modify" : "create",
        description: "Add Codex lifecycle hooks using text-mode Jumbo output",
      },
    ];
  }
}
