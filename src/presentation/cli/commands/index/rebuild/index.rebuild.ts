/**
 * CLI Command: jumbo index rebuild
 *
 * Rebuilds the projected global search index from persisted events.
 */

import type { Command } from "commander";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { SearchIndexRebuildController } from "../../../../../application/context/search/SearchIndexRebuildController.js";
import { FsEventStore } from "../../../../../infrastructure/persistence/FsEventStore.js";
import { SqliteSearchIndexStore } from "../../../../../infrastructure/context/search/SqliteSearchIndexStore.js";
import { SearchDocumentProjectorRegistry } from "../../../../../application/context/search/SearchDocumentProjectorRegistry.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { IndexRebuildOutputBuilder } from "./IndexRebuildOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RenderData } from "../../../rendering/types.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo index rebuild",
    description:
      "Repair the project search index without rebuilding every projection",
  },
  {
    command: "jumbo index rebuild --format json",
    description: "Emit structured rebuild statistics for agents",
  },
];

/**
 * The abstract ports the `index rebuild` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface IndexRebuildDependencies {
  readonly searchIndexRebuildController: SearchIndexRebuildController;
}

/**
 * Composes exactly the features the `index rebuild` leaf uses.
 */
async function createIndexRebuildDependencies(): Promise<IndexRebuildDependencies> {
  return new LeafContainerBuilder().withSearchIndexRebuildFeature().build();
}

/** Registers the `index rebuild` leaf under the parent supplied by its group. */
export function registerIndexRebuildCommand(index: Command): void {
  const command = index
    .command("rebuild")
    .description(
      "Rebuild the projected global search index from persisted events",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "index rebuild",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: ["search", "heal", "evolve"],
      }),
    });

  let dependencies: IndexRebuildDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createIndexRebuildDependencies();
  });

  command.action(async () => {
    if (!dependencies) {
      throw new Error("Index rebuild dependencies were not initialized.");
    }
    await indexRebuild({}, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function indexRebuild(
  _options: Record<string, never>,
  container: IndexRebuildDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new IndexRebuildOutputBuilder();

  try {
    const response = await container.searchIndexRebuildController.handle({});
    const output = outputBuilder.buildSuccess(response);

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    const output = outputBuilder.buildFailure(
      error instanceof Error ? error : String(error),
    );

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    const data = output.getSections().find((section) => section.type === "data")
      ?.content as RenderData;
    renderer.error(String(data.error), String(data.details));
    process.exit(1);
  }
}
