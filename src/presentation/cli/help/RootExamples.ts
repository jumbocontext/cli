/** Formats the EXAMPLES section shown at the bottom of `jumbo --help`. */

interface RootExample {
  readonly description: string;
  readonly command: string;
}

const ROOT_EXAMPLES: readonly RootExample[] = [
  {
    description: "Initialize a new Jumbo project interactively",
    command: "jumbo init",
  },
  {
    description: "Start (or resume) work on a goal",
    command: "jumbo work start",
  },
  {
    description: "Record architectural context for future sessions",
    command: "jumbo architecture update",
  },
];

/** Renders the root EXAMPLES section, or an empty string when no examples exist. */
export function formatRootExamples(): string {
  if (ROOT_EXAMPLES.length === 0) return "";

  const lines: string[] = ["EXAMPLES"];
  for (const example of ROOT_EXAMPLES) {
    lines.push(`  # ${example.description}`);
    lines.push(`  $ ${example.command}`);
  }
  return lines.join("\n");
}
