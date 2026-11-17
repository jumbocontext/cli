import { describe, expect, it } from "@jest/globals";
import type { CommandMetadata } from "../../../../../src/presentation/cli/commands/registry/CommandMetadata.js";
import { formatSubcommandHelp } from "../../../../../src/presentation/cli/help/SubcommandHelpFormatter.js";

describe("formatSubcommandHelp", () => {
  it("formats top-level command help without requiring a parent subcommand path", () => {
    const command: { path: string; metadata: CommandMetadata } = {
      path: "search",
      metadata: {
        description: "Search the global Jumbo memory index",
        requiredOptions: [
          {
            flags: "-q, --query <query>",
            description: "Search query text",
          },
        ],
        options: [
          {
            flags: "-o, --output <output>",
            description: "Output detail level: default or compact",
          },
        ],
        examples: [
          {
            command: 'jumbo search --query "event bus"',
            description: "Search all memory categories",
          },
        ],
        related: ["components search"],
      },
    };

    const help = formatSubcommandHelp(command);

    expect(help).toContain("USAGE\n  jumbo search [flags]");
    expect(help).toContain("-q, --query <query>");
    expect(help).toContain("(required)");
    expect(help).toContain("jumbo components search");
  });
});
