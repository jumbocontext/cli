/**
 * Command Metadata Model
 *
 * Help-facing facts that Commander cannot read back from a registered
 * command: help grouping, examples, and related-command links.
 */

import type { CommandCategory } from "../../help/CommandCategories.js";

/**
 * Command option definition
 */
export interface CommandOption {
  /** Option flags (e.g., "--id <goalId>" or "-g, --id <goalId>") */
  flags: string;
  /** Human-readable description of what this option does */
  description: string;
  /** Default value if not provided (only for optional options) */
  default?: string | number | boolean;
  /** Hide this option from help output (but still accept it) */
  hidden?: boolean;
}

/**
 * Usage example for a command
 */
export interface CommandExample {
  /** Example command invocation */
  command: string;
  /** What this example demonstrates */
  description: string;
}

/**
 * Complete command metadata
 */
export interface CommandMetadata {
  /** Command description (shown in help) */
  description: string;
  /** Category for grouping in help output (gh-style organization) */
  category?: CommandCategory;
  /** Required options (command will error if not provided) */
  requiredOptions?: CommandOption[];
  /** Optional options */
  options?: CommandOption[];
  /** Usage examples (shown in detailed help) */
  examples?: CommandExample[];
  /** Related commands (for discoverability) */
  related?: string[];
  /** Hide from main help (for deprecated/experimental commands) */
  hidden?: boolean;
  /** Top-level command aliases (e.g., ["init"] makes "jumbo init" work like "jumbo project init") */
  topLevelAliases?: string[];
}

/**
 * Shared option for cross-phase transition commands.
 * When present, next-step output is a directive; when absent, output is informational guidance.
 */
export const CONTINUE_OPTION: CommandOption = {
  flags: "-c, --continue",
  description:
    "Output next-step as a directive instead of informational guidance",
};
