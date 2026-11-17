/**
 * CLI Command: jumbo audiencePain add
 *
 * Captures a pain point that the project addresses for its audience.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddAudiencePainController } from "../../../../../application/context/audience-pains/add/AddAudiencePainController.js";
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
    command:
      'jumbo audiencePain add --title "Context loss" --description "LLMs lose context between sessions"',
    description: "Add a pain point about context management",
  },
  {
    command:
      'jumbo audiencePain add --title "Token costs" --description "High costs from repeated context loading"',
    description: "Add a pain point about efficiency",
  },
];

const RELATED_COMMANDS = ["audiencePain update", "audience add"];

/**
 * The abstract ports the `audiencePain add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface AudiencePainAddDependencies {
  readonly addAudiencePainController: AddAudiencePainController;
}

/**
 * Composes exactly the feature the `audiencePain add` leaf uses.
 */
async function createAudiencePainAddDependencies(): Promise<AudiencePainAddDependencies> {
  return new LeafContainerBuilder().withAudiencePainFeature().build();
}

/** Registers the `audiencePain add` leaf under the parent supplied by its group. */
export function registerAudiencePainAddCommand(audiencePain: Command): void {
  const command = audiencePain
    .command("add")
    .description("Add an audience pain point that the project addresses")
    .requiredOption("-t, --title <title>", "Brief title of the pain point")
    .requiredOption("-d, --description <description>", "Detailed description of the problem");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audiencePain add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudiencePainAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudiencePainAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("AudiencePain add dependencies were not initialized.");
    await audiencePainAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainAdd(
  options: {
    title: string;
    description: string;
  },
  container: AudiencePainAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.addAudiencePainController.handle({
      title: options.title,
      description: options.description,
    });

    const data: Record<string, string> = {
      painId: response.painId,
      title: response.title,
      description: response.description,
    };

    if (response.version !== null) {
      data.version = response.version.toString();
    }

    renderer.success(
      `Audience pain '${response.title}' captured successfully.`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to add audience pain",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
