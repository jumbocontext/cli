/**
 * CLI Command: jumbo audience add
 *
 * Registers a target audience for the project with priority level.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddAudienceController } from "../../../../../application/context/audiences/add/AddAudienceController.js";
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
    command:
      'jumbo audience add --name "Software Developers" --description "Professional developers building LLM-powered applications" --priority primary',
    description: "Add a primary target audience",
  },
  {
    command:
      'jumbo audience add --name "DevOps Engineers" --description "Engineers managing CI/CD pipelines and deployment" --priority secondary',
    description: "Add a secondary audience",
  },
];

const RELATED_COMMANDS = ["audience update", "audience remove", "audience pain add"];

/**
 * The abstract ports the `audience add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface AudienceAddDependencies {
  readonly addAudienceController: AddAudienceController;
}

/**
 * Composes exactly the feature the `audience add` leaf uses.
 */
async function createAudienceAddDependencies(): Promise<AudienceAddDependencies> {
  return new LeafContainerBuilder().withAudienceFeature().build();
}

/** Registers the `audience add` leaf under the parent supplied by its group. */
export function registerAudienceAddCommand(audience: Command): void {
  const command = audience
    .command("add")
    .description("Add a target audience for the project")
    .requiredOption("-n, --name <name>", "Audience name (e.g., 'Software Developers')")
    .requiredOption("-d, --description <description>", "Who they are and what they do")
    .requiredOption("--priority <priority>", "Priority level (primary, secondary, tertiary)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audience add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudienceAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudienceAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Audience add dependencies were not initialized.");
    await audienceAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceAdd(
  options: {
    name: string;
    description: string;
    priority: AudiencePriorityType;
  },
  container: AudienceAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.addAudienceController.handle({
      name: options.name,
      description: options.description,
      priority: options.priority,
    });

    // Success output
    const data: Record<string, string> = {
      audienceId: response.audienceId,
      name: response.name,
      priority: response.priority,
      description: response.description,
    };

    renderer.success(`Audience '${response.name}' added successfully.`, data);
  } catch (error) {
    renderer.error(
      "Failed to add audience",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
