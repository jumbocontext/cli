/**
 * CLI Command: jumbo guideline update
 *
 * Updates an existing guideline with new values.
 * Supports partial updates - only provided fields are changed.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateGuidelineController } from "../../../../../application/context/guidelines/update/UpdateGuidelineController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GuidelineCategoryValue } from "../../../../../domain/guidelines/Constants.js";
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
    command: "jumbo guideline update --id guid_123 --title 'Updated Title'",
    description: "Update guideline title",
  },
  {
    command:
      "jumbo guideline update --id guid_123 --category testing --rationale 'Regulatory requirement'",
    description: "Update guideline category and rationale",
  },
];

const RELATED_COMMANDS = ["guideline add", "guideline remove"];

/**
 * The abstract ports the `guideline update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GuidelineUpdateDependencies {
  readonly updateGuidelineController: UpdateGuidelineController;
}

/**
 * Composes exactly the features the `guideline update` leaf uses.
 */
async function createGuidelineUpdateDependencies(): Promise<GuidelineUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateGuidelineFeature().build();
}

/** Registers the `guideline update` leaf under the parent supplied by its group. */
export function registerGuidelineUpdateCommand(guideline: Command): void {
  const command = guideline
    .command("update")
    .description("Update an existing guideline")
    .requiredOption("-i, --id <id>", "ID of the guideline to update")
    .option(
      "-c, --category <category>",
      "Updated category (testing, codingStyle, process, communication, documentation, security, performance, other)",
    )
    .option("-t, --title <title>", "Updated guideline title")
    .option("-d, --description <description>", "Updated guideline description")
    .option("--rationale <rationale>", "Updated rationale for the guideline")
    .option("--example <path...>", "Updated list of example paths");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guideline update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelineUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelineUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guideline update dependencies were not initialized.");
    }
    await guidelineUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineUpdate(
  options: {
    id: string;
    category?: GuidelineCategoryValue;
    title?: string;
    description?: string;
    rationale?: string;
    example?: string[];
  },
  container: GuidelineUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateGuidelineController.handle({
      id: options.id,
      ...(options.category !== undefined && { category: options.category }),
      ...(options.title !== undefined && { title: options.title }),
      ...(options.description !== undefined && {
        description: options.description,
      }),
      ...(options.rationale !== undefined && { rationale: options.rationale }),
      ...(options.example !== undefined && { examples: options.example }),
    });

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: response.guidelineId,
      updatedFields: response.updatedFields.join(", "),
    };

    if (response.category !== undefined) data.category = response.category;
    if (response.title !== undefined) data.title = response.title;
    if (response.version !== undefined) data.version = response.version;

    renderer.success(`Guideline '${options.id}' updated successfully`, data);
  } catch (error) {
    renderer.error(
      "Failed to update guideline",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
