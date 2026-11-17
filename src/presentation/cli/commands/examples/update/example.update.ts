import type { Command } from "commander";

interface ExampleUpdateOptions {
  readonly id: string;
  readonly value: string;
}

/** Registers the `example update` leaf under the parent supplied by its group. */
export function registerExampleUpdateCommand(example: Command): void {
  const command = example
    .command("update")
    .description("Update an example value")
    .requiredOption("--id <id>", "The example identifier")
    .requiredOption("-v, --value <value>", "The replacement value");

  command.hook("preAction", async () => {
    // A production leaf builds its command-specific container here. Commander
    // has already selected and validated this leaf before this hook runs.
  });

  command.action(async (options: ExampleUpdateOptions) => {
    void options;

    // A production leaf invokes its handler here using the container built by
    // its preAction hook.
    await Promise.resolve();
  });
}
