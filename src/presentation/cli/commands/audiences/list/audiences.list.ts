/**
 * CLI Command: jumbo audiences list
 *
 * Lists all active (non-removed) target audiences for the project.
 *
 * Usage:
 *   jumbo audiences list
 *   jumbo audiences list --format json
 *   jumbo audiences list --format yaml
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ListAudiencesController } from "../../../../../application/context/audiences/list/ListAudiencesController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { AudienceListOutputBuilder } from "./AudienceListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo audiences list",
    description: "List all audiences in text format",
  },
  {
    command: "jumbo audiences list --format json",
    description: "List all audiences as JSON",
  },
  {
    command: "jumbo audiences list --format yaml",
    description: "List all audiences as YAML",
  },
];

const RELATED_COMMANDS = ["audience add", "audience update", "audience remove"];

/**
 * The abstract ports the `audiences list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface AudiencesListDependencies {
  readonly listAudiencesController: ListAudiencesController;
}

/**
 * Composes exactly the feature the `audiences list` leaf uses.
 */
async function createAudiencesListDependencies(): Promise<AudiencesListDependencies> {
  return new LeafContainerBuilder().withListAudiencesFeature().build();
}

/** Registers the `audiences list` leaf under the parent supplied by its group. */
export function registerAudiencesListCommand(audiences: Command): void {
  const command = audiences
    .command("list")
    .description("List all target audiences for the project");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audiences list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudiencesListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudiencesListDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("Audiences list dependencies were not initialized.");
    await audiencesList(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencesList(container: AudiencesListDependencies) {
  const renderer = Renderer.getInstance();

  try {
    const { audiences } = await container.listAudiencesController.handle({});

    if (audiences.length === 0) {
      renderer.info(
        "No audiences defined yet. Use 'jumbo audience add' to add one.",
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new AudienceListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(audiences);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(audiences);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list audiences",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
