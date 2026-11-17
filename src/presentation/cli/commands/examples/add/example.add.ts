import type { Command } from "commander";

interface ExampleAddOptions {
  readonly value: string;
}

/**
 * Registers the `example add` leaf.
 *
 * The command group owns the `example` parent and passes it here. This leaf
 * owns its Commander grammar, its invocation-local state, and its action.
 */
export function registerExampleAddCommand(example: Command): void {
  const command = example
    .command("add")
    .description("Add an example value")
    .requiredOption("-v, --value <value>", "The value to add");

  let value: string | undefined;

  command.hook("preAction", () => {
    value = undefined;
  });

  command.action(async (options: ExampleAddOptions) => {
    value = options.value;

    // A production leaf builds only the dependencies it needs in preAction,
    // then invokes its handler here with parsed options and those dependencies.
    await Promise.resolve();
  });
}
