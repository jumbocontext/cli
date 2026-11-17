/**
 * CLI Command: jumbo guideline remove
 *
 * Marks a guideline as removed.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveGuidelineController } from "../../../../../application/context/guidelines/remove/RemoveGuidelineController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo guideline remove --id gl_123",
    description: "Remove a guideline",
  },
  {
    command:
      "jumbo guideline remove --id gl_123 --reason 'Superseded by new testing framework'",
    description: "Remove a guideline with reason",
  },
];

const RELATED_COMMANDS = ["guideline add", "guideline update"];

/**
 * The abstract ports the `guideline remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GuidelineRemoveDependencies {
  readonly removeGuidelineController: RemoveGuidelineController;
}

/**
 * Composes exactly the features the `guideline remove` leaf uses.
 */
async function createGuidelineRemoveDependencies(): Promise<GuidelineRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveGuidelineFeature().build();
}

/** Registers the `guideline remove` leaf under the parent supplied by its group. */
export function registerGuidelineRemoveCommand(guideline: Command): void {
  const command = guideline
    .command("remove")
    .description("Remove an execution guideline")
    .requiredOption("-i, --id <id>", "ID of the guideline to remove")
    .option("-r, --reason <text>", "Reason for removal");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guideline remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelineRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelineRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guideline remove dependencies were not initialized.");
    }
    await guidelineRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineRemove(
  options: {
    id: string;
    reason?: string;
  },
  container: GuidelineRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeGuidelineController.handle({
      guidelineId: options.id,
      reason: options.reason,
    });

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: response.guidelineId,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(
      `Guideline '${response.title}' removed successfully`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to remove guideline",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
