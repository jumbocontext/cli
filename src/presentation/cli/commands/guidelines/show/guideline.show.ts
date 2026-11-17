/**
 * CLI Command: jumbo guideline show
 *
 * Displays the complete execution guideline record.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ShowGuidelineController } from "../../../../../application/context/guidelines/show/ShowGuidelineController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { GuidelineShowOutputBuilder } from "./GuidelineShowOutputBuilder.js";
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
    command: "jumbo guideline show --id guide_abc123",
    description: "Show the complete guideline record",
  },
  {
    command: "jumbo guideline show --id guide_abc123 --format json",
    description: "Show the complete guideline record as JSON",
  },
  {
    command: "jumbo guideline show --id guide_abc123 --format text",
    description: "Show the complete guideline record as rich text",
  },
];

const RELATED_COMMANDS = ["guidelines list", "guidelines search", "guideline update"];

/**
 * The abstract ports the `guideline show` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GuidelineShowDependencies {
  readonly showGuidelineController: ShowGuidelineController;
}

/**
 * Composes exactly the features the `guideline show` leaf uses.
 */
async function createGuidelineShowDependencies(): Promise<GuidelineShowDependencies> {
  return new LeafContainerBuilder().withShowGuidelineFeature().build();
}

/** Registers the `guideline show` leaf under the parent supplied by its group. */
export function registerGuidelineShowCommand(guideline: Command): void {
  const command = guideline
    .command("show")
    .description("Display the complete execution guideline record")
    .requiredOption("-i, --id <guidelineId>", "ID of the guideline to show");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guideline show",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelineShowDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelineShowDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guideline show dependencies were not initialized.");
    }
    await guidelineShow(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineShow(
  options: { id: string },
  container: GuidelineShowDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GuidelineShowOutputBuilder();

  try {
    const { guideline } = await container.showGuidelineController.handle({
      guidelineId: options.id,
    });

    if (renderer.getConfig().format === "text") {
      // Preserve the builder's DesignTokens colors without Renderer.info's legacy tint.
      renderer.banner([outputBuilder.build(guideline).toHumanReadable()]);
      return;
    }

    const dataSection = outputBuilder
      .buildStructuredOutput(guideline)
      .getSections()
      .find((section) => section.type === "data");

    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output =
      error instanceof Error &&
      error.message === `Guideline not found: ${options.id}`
        ? outputBuilder.buildNotFoundError(options.id)
        : outputBuilder.buildFailureError(
            error instanceof Error ? error : String(error),
          );

    renderer.error(output.toHumanReadable());
    process.exitCode = 1;
  }
}
