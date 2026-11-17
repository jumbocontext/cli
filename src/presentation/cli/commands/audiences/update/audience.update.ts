/**
 * CLI Command: jumbo audience update
 *
 * Updates an existing audience's details.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateAudienceController } from "../../../../../application/context/audiences/update/UpdateAudienceController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { AudiencePriorityType } from "../../../../../domain/audiences/Constants.js";
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
    command: "jumbo audience update --id audience-123 --name 'Updated Name'",
    description: "Update audience name",
  },
  {
    command:
      'jumbo audience update --id audience-123 --name "Software Engineers" --description "Professional developers" --priority primary',
    description: "Update multiple fields",
  },
];

const RELATED_COMMANDS = ["audience add", "audience remove"];

/**
 * The abstract ports the `audience update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface AudienceUpdateDependencies {
  readonly updateAudienceController: UpdateAudienceController;
}

/**
 * Composes exactly the feature the `audience update` leaf uses.
 */
async function createAudienceUpdateDependencies(): Promise<AudienceUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateAudienceFeature().build();
}

/** Registers the `audience update` leaf under the parent supplied by its group. */
export function registerAudienceUpdateCommand(audience: Command): void {
  const command = audience
    .command("update")
    .description("Update an existing audience")
    .requiredOption("-i, --id <id>", "ID of the audience to update")
    .option("-n, --name <name>", "Updated audience name")
    .option("-d, --description <description>", "Updated audience description")
    .option(
      "--priority <priority>",
      "Updated priority (primary, secondary, tertiary)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audience update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudienceUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudienceUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Audience update dependencies were not initialized.");
    await audienceUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceUpdate(
  options: {
    id: string;
    name?: string;
    description?: string;
    priority?: AudiencePriorityType;
  },
  container: AudienceUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateAudienceController.handle({
      audienceId: options.id,
      name: options.name,
      description: options.description,
      priority: options.priority,
    });

    // Success output
    const data: Record<string, string> = {
      audienceId: response.audienceId,
    };

    if (options.name) data.name = options.name;
    if (options.description) data.description = options.description;
    if (options.priority) data.priority = options.priority;

    renderer.success(
      `Audience '${options.name || options.id}' updated successfully.`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to update audience",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
