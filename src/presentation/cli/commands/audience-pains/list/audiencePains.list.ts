/**
 * CLI Command: jumbo audiencePains list
 *
 * Lists all active (non-resolved) audience pain points for the project.
 *
 * Usage:
 *   jumbo audiencePains list
 *   jumbo audiencePains list --format json
 *   jumbo audiencePains list --format yaml
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetAudiencePainsController } from "../../../../../application/context/audience-pains/list/GetAudiencePainsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { AudiencePainListOutputBuilder } from "./AudiencePainListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo audiencePains list",
    description: "List all active pain points in text format",
  },
  {
    command: "jumbo audiencePains list --format json",
    description: "List all pain points as JSON",
  },
  {
    command: "jumbo audiencePains list --format yaml",
    description: "List all pain points as YAML",
  },
];

const RELATED_COMMANDS = ["audiencePain add", "audiencePain update"];

/**
 * The abstract ports the `audiencePains list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface AudiencePainsListDependencies {
  readonly getAudiencePainsController: GetAudiencePainsController;
}

/**
 * Composes exactly the feature the `audiencePains list` leaf uses.
 */
async function createAudiencePainsListDependencies(): Promise<AudiencePainsListDependencies> {
  return new LeafContainerBuilder().withGetAudiencePainsFeature().build();
}

/** Registers the `audiencePains list` leaf under the parent supplied by its group. */
export function registerAudiencePainsListCommand(audiencePains: Command): void {
  const command = audiencePains
    .command("list")
    .description("List all active audience pain points");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "audiencePains list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: AudiencePainsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createAudiencePainsListDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("AudiencePains list dependencies were not initialized.");
    await audiencePainsList(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainsList(
  container: AudiencePainsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const { pains } = await container.getAudiencePainsController.handle({});

    if (pains.length === 0) {
      renderer.info(
        "No active pain points. Use 'jumbo audiencePain add' to add one.",
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new AudiencePainListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(pains);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(pains);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list audience pains",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
