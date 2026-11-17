/**
 * CLI Command: jumbo decision update
 *
 * Updates an existing decision.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateDecisionController } from "../../../../../application/context/decisions/update/UpdateDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { UpdateDecisionRequest } from "../../../../../application/context/decisions/update/UpdateDecisionRequest.js";
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
      'jumbo decision update --id dec_123 --title "Use JWT with refresh tokens"',
    description: "Update decision title",
  },
  {
    command:
      'jumbo decision update --id dec_123 --context "Updated context" --rationale "Updated rationale"',
    description: "Update multiple fields",
  },
];

const RELATED_COMMANDS = ["decision add", "decision reverse", "decision supersede"];

/**
 * The abstract ports the `decision update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface DecisionUpdateDependencies {
  readonly updateDecisionController: UpdateDecisionController;
}

/**
 * Composes exactly the feature the `decision update` leaf uses.
 */
async function createDecisionUpdateDependencies(): Promise<DecisionUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateDecisionFeature().build();
}

/** Registers the `decision update` leaf under the parent supplied by its group. */
export function registerDecisionUpdateCommand(decision: Command): void {
  const command = decision
    .command("update")
    .description("Update an existing decision")
    .requiredOption("-i, --id <id>", "Decision ID to update")
    .option("-t, --title <title>", "Updated decision title")
    .option("--context <context>", "Updated decision context")
    .option("--rationale <rationale>", "Updated decision rationale")
    .option(
      "--alternative <items...>",
      "Alternatives considered (can specify multiple)",
    )
    .option("--consequences <consequences>", "Updated consequences");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision update dependencies were not initialized.");
    await decisionUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionUpdate(
  options: {
    id: string;
    title?: string;
    context?: string;
    rationale?: string;
    alternative?: string[];
    consequences?: string;
  },
  container: DecisionUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: UpdateDecisionRequest = {
      decisionId: options.id,
      title: options.title,
      context: options.context,
      rationale: options.rationale,
      alternatives: options.alternative,
      consequences: options.consequences,
    };

    const response = await container.updateDecisionController.handle(request);

    // Success output - show what was updated
    const updatedFields: string[] = [];
    if (options.title) updatedFields.push("title");
    if (options.context) updatedFields.push("context");
    if (options.rationale) updatedFields.push("rationale");
    if (options.alternative) updatedFields.push("alternatives");
    if (options.consequences) updatedFields.push("consequences");

    renderer.success(`Decision updated (${response.decisionId})`);
    renderer.info(`Updated fields: ${updatedFields.join(", ")}`);
  } catch (error) {
    renderer.error(
      "Failed to update decision",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
