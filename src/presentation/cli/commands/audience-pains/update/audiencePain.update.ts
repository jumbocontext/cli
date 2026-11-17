/**
 * CLI Command: jumbo audiencePain update
 *
 * Updates an existing audience pain's details (title and/or description).
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateAudiencePainController } from "../../../../../application/context/audience-pains/update/UpdateAudiencePainController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { UpdateAudiencePainRequest } from "../../../../../application/context/audience-pains/update/UpdateAudiencePainRequest.js";
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
    command:
      'jumbo audiencePain update --id pain_123 --title "Context persistence challenge"',
    description: "Update pain title",
  },
  {
    command:
      'jumbo audiencePain update --id pain_123 --description "New description"',
    description: "Update pain description",
  },
  {
    command:
      'jumbo audiencePain update --id pain_123 --title "New title" --description "New description"',
    description: "Update both title and description",
  },
];

const RELATED_COMMANDS = ["audiencePain add", "audience add"];

/**
 * The abstract ports the `audiencePain update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface AudiencePainUpdateDependencies {
  readonly updateAudiencePainController: UpdateAudiencePainController;
}

/**
 * Composes exactly the feature the `audiencePain update` leaf uses.
 */
async function createAudiencePainUpdateDependencies(): Promise<AudiencePainUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateAudiencePainFeature().build();
}

/** Registers the `audiencePain update` leaf under the parent supplied by its group. */
export function registerAudiencePainUpdateCommand(
  audiencePain: Command,
): void {
  const command = audiencePain
    .command("update")
    .description("Update an existing audience pain's title or description")
    .requiredOption("-i, --id <id>", "ID of the audience pain to update")
    .option("-t, --title <title>", "Updated pain title (at least one field required)")
    .option(
      "-d, --description <description>",
      "Updated pain description (at least one field required)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audiencePain update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudiencePainUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudiencePainUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("AudiencePain update dependencies were not initialized.");
    await audiencePainUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainUpdate(
  options: {
    id: string;
    title?: string;
    description?: string;
  },
  container: AudiencePainUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (!options.title && !options.description) {
    renderer.error(
      "Must provide at least one field to update (--title or --description)",
    );
    process.exit(1);
  }

  try {
    const request: UpdateAudiencePainRequest = {
      painId: options.id,
      title: options.title,
      description: options.description,
    };

    const { painId, view } =
      await container.updateAudiencePainController.handle(request);

    // Success output
    const data: Record<string, string> = {
      painId,
    };

    if (view) {
      data.title = view.title;
      data.description = view.description;
      data.version = view.version.toString();
    }

    renderer.success(`Audience pain updated successfully.`, data);
  } catch (error) {
    renderer.error(
      "Failed to update audience pain",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
