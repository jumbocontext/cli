/**
 * CLI Command: jumbo invariants list
 *
 * Lists all project invariants.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetInvariantsController } from "../../../../../application/context/invariants/get/GetInvariantsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { InvariantListOutputBuilder } from "./InvariantListOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  { command: "jumbo invariants list", description: "List all invariants" },
  {
    command: "jumbo invariants list --format json",
    description: "List invariants as JSON",
  },
];

const RELATED_COMMANDS = ["invariant add", "invariant update", "invariant remove"];

/**
 * The abstract ports the `invariants list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface InvariantsListDependencies {
  readonly getInvariantsController: GetInvariantsController;
}

/**
 * Composes exactly the features the `invariants list` leaf uses.
 */
async function createInvariantsListDependencies(): Promise<InvariantsListDependencies> {
  return new LeafContainerBuilder().withGetInvariantsFeature().build();
}

/** Registers the `invariants list` leaf under the parent supplied by its group. */
export function registerInvariantsListCommand(invariants: Command): void {
  const command = invariants
    .command("list")
    .description("List all project invariants");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "invariants list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: InvariantsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createInvariantsListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Invariants list dependencies were not initialized.");
    }
    await invariantsList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantsList(
  _options: Record<string, never>,
  container: InvariantsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const { invariants } =
      await container.getInvariantsController.getAllInvariants({});

    if (invariants.length === 0) {
      renderer.info(
        "No invariants found. Use 'jumbo invariant add' to add one.",
      );
      return;
    }

    const config = renderer.getConfig();

    const outputBuilder = new InvariantListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(invariants);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(invariants);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list invariants",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
