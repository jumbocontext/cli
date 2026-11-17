/**
 * CLI Command: jumbo audience remove
 *
 * Removes a target audience from the project (soft-delete).
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveAudienceController } from "../../../../../application/context/audiences/remove/RemoveAudienceController.js";
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
    command: 'jumbo audience remove --id "audience-123"',
    description: "Remove an audience",
  },
  {
    command:
      'jumbo audience remove --id "audience-123" --reason "No longer in target market"',
    description: "Remove an audience with a reason",
  },
];

const RELATED_COMMANDS = ["audience add", "audience update", "audience pain add"];

/**
 * The abstract ports the `audience remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface AudienceRemoveDependencies {
  readonly removeAudienceController: RemoveAudienceController;
}

/**
 * Composes exactly the feature the `audience remove` leaf uses.
 */
async function createAudienceRemoveDependencies(): Promise<AudienceRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveAudienceFeature().build();
}

/** Registers the `audience remove` leaf under the parent supplied by its group. */
export function registerAudienceRemoveCommand(audience: Command): void {
  const command = audience
    .command("remove")
    .description("Remove an audience from the project")
    .requiredOption("-i, --id <id>", "ID of the audience to remove")
    .option("-r, --reason <reason>", "Reason for removing the audience");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audience remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudienceRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudienceRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Audience remove dependencies were not initialized.");
    await audienceRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceRemove(
  options: {
    id: string;
    reason?: string;
  },
  container: AudienceRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeAudienceController.handle({
      audienceId: options.id,
      reason: options.reason,
    });

    const data: Record<string, string> = {
      audienceId: response.audienceId,
      name: response.name,
    };

    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(`Audience '${response.name}' removed successfully.`, data);
  } catch (error) {
    renderer.error(
      "Failed to remove audience",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
