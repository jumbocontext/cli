/** Formats root commands in categorized gh-style help output. */

import type { Command } from "commander";
import {
  COMMAND_CATEGORIES,
  COMMAND_CATEGORY_LABELS,
  type CommandCategory,
} from "./CommandCategories.js";

const categories = new WeakMap<Command, CommandCategory>();
const DESCRIPTION_START_COLUMN = 26;

/** Associates presentation-only help metadata with a registered Commander command. */
export function categorizeCommand(
  command: Command,
  category: CommandCategory,
): void {
  categories.set(command, category);
}

function formatCommandLine(name: string, description: string): string {
  return `  ${name.padEnd(DESCRIPTION_START_COLUMN - 2)}${description}`;
}

interface HelpEntry {
  path: string;
  description: string;
}

function isVisible(command: Command): boolean {
  return !(command as Command & { _hidden?: boolean })._hidden;
}

/**
 * Flattens a registered root command into help entries.
 *
 * A parent group contributes one entry per visible subcommand, using the full
 * path (e.g. "project init"). A leaf contributes a single entry for itself.
 */
function toHelpEntries(command: Command): HelpEntry[] {
  const visibleSubcommands = command.commands.filter(isVisible);

  if (visibleSubcommands.length === 0) {
    return [{ path: command.name(), description: command.description() }];
  }

  return visibleSubcommands.map((subcommand) => ({
    path: `${command.name()} ${subcommand.name()}`,
    description: subcommand.description(),
  }));
}

/** Formats the actual registered root commands, grouped by their annotations. */
export function formatCategorizedCommands(program: Command): string {
  const grouped = new Map<CommandCategory | "uncategorized", HelpEntry[]>();

  for (const command of program.commands) {
    if (!isVisible(command)) continue;

    const category = categories.get(command) ?? "uncategorized";
    const entries = grouped.get(category) ?? [];
    entries.push(...toHelpEntries(command));
    grouped.set(category, entries);
  }

  const formatCategory = (
    category: CommandCategory | "uncategorized",
    entries: readonly HelpEntry[],
  ): string => {
    const title =
      category === "uncategorized"
        ? "OTHER COMMANDS"
        : COMMAND_CATEGORY_LABELS[category];
    const lines = [...entries]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((entry) => formatCommandLine(entry.path, entry.description));

    return [title, ...lines].join("\n");
  };

  const sections: string[] = [];
  for (const category of COMMAND_CATEGORIES) {
    const commands = grouped.get(category);
    if (commands?.length) sections.push(formatCategory(category, commands));
  }

  const uncategorized = grouped.get("uncategorized");
  if (uncategorized?.length) {
    sections.push(formatCategory("uncategorized", uncategorized));
  }

  return sections.join("\n\n");
}
