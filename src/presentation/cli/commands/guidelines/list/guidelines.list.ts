/**
 * CLI Command: jumbo guidelines list
 *
 * Lists all execution guidelines with optional category filtering.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetGuidelinesController } from "../../../../../application/context/guidelines/get/GetGuidelinesController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { GuidelineListOutputBuilder } from "./GuidelineListOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  { command: "jumbo guidelines list", description: "List all guidelines" },
  {
    command: "jumbo guidelines list --category testing",
    description: "List testing guidelines",
  },
  {
    command: "jumbo guidelines list --format json",
    description: "List guidelines as JSON",
  },
];

const RELATED_COMMANDS = ["guideline add", "guideline update", "guideline remove"];

/**
 * The abstract ports the `guidelines list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GuidelinesListDependencies {
  readonly getGuidelinesController: GetGuidelinesController;
}

/**
 * Composes exactly the features the `guidelines list` leaf uses.
 */
async function createGuidelinesListDependencies(): Promise<GuidelinesListDependencies> {
  return new LeafContainerBuilder().withGetGuidelinesFeature().build();
}

/** Registers the `guidelines list` leaf under the parent supplied by its group. */
export function registerGuidelinesListCommand(guidelines: Command): void {
  const command = guidelines
    .command("list")
    .description("List all execution guidelines")
    .option(
      "-c, --category <category>",
      "Filter by category (e.g., codingStyle, testing, process)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guidelines list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelinesListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelinesListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guidelines list dependencies were not initialized.");
    }
    await guidelinesList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelinesList(
  options: { category?: string },
  container: GuidelinesListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const { guidelines } = await container.getGuidelinesController.handle({
      category: options.category,
    });

    if (guidelines.length === 0) {
      const filterMsg = options.category
        ? ` in category '${options.category}'`
        : "";
      renderer.info(
        `No guidelines found${filterMsg}. Use 'jumbo guideline add' to add one.`,
      );
      return;
    }

    const config = renderer.getConfig();

    const outputBuilder = new GuidelineListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(guidelines, options.category);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        guidelines,
        options.category,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list guidelines",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
