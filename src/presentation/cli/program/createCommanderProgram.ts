/**
 * Commander Program Construction
 *
 * Creates and configures the Commander.js program instance.
 * Centralizes CLI structure: name, version, usage, and help formatting.
 */

import { Command } from "commander";
import { Renderer } from "../rendering/Renderer.js";
import type { OutputFormat, VerbosityLevel } from "../rendering/types.js";
import { formatCategorizedCommands } from "../help/CategoryFormatter.js";
import { formatRootExamples } from "../help/RootExamples.js";

/**
 * Creates a configured Commander program instance.
 *
 * @param version - CLI version string
 * @returns Configured Commander program
 */
export function createCommanderProgram(version: string): Command {
  const program = new Command();

  program
    .name("jumbo")
    .version(version)
    .usage("<command> <subcommand> [flags]")
    .option(
      "--format <format>",
      "Output format: text, json, yaml, ndjson (default: auto-detect)",
    )
    .option("--quiet", "Minimal output (suppress info messages)")
    .option("--verbose", "Verbose output (show detailed info)")
    .configureHelp({
      // Align option descriptions to start at column 26 (matching command descriptions)
      // Formula: 2 (indent) + padWidth + 2 (gap) = 26, so padWidth = 22
      padWidth: () => 22,
    })
    .configureOutput({
      writeOut: (text) => process.stdout.write(text),
      writeErr: (text) => process.stderr.write(text),
    });

  // Keep Commander's existing -V/--version output and accept Jumbo's documented -v.
  program.version(version, "-v");
  program.options.at(-1)!.hideHelp();
  program
    .command("version")
    .description("Show CLI version")
    .action(() => {
      program.configureOutput().writeOut?.(`${version}\n`);
    });

  const originalHelp = program.helpInformation.bind(program);
  program.helpInformation = function () {
    let help = originalHelp().replace(/^Options:/gm, "OPTIONS:");
    const commandsRegex = /^Commands:[\s\S]*$/m;

    if (commandsRegex.test(help)) {
      help = help.replace(commandsRegex, formatCategorizedCommands(program));
    }

    const examples = formatRootExamples();
    if (examples) {
      help += "\n\n" + examples + "\n";
    }

    return help;
  };

  program.hook("preAction", (thisCommand) => {
    configureRendererFromOptions(thisCommand);
  });

  return program;
}

function configureRendererFromOptions(command: Command): void {
  const options = command.opts();

  let verbosity: VerbosityLevel = "normal";
  if (options.quiet) verbosity = "quiet";
  else if (options.verbose) verbosity = "verbose";

  Renderer.configure({
    format: options.format as OutputFormat | undefined,
    verbosity,
  });
}
