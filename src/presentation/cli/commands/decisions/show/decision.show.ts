/**
 * CLI Command: jumbo decision show
 *
 * Displays the complete architectural decision record.
 */

import type { Command } from "commander";
import type { ShowDecisionController } from "../../../../../application/context/decisions/show/ShowDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { DecisionShowOutputBuilder } from "./DecisionShowOutputBuilder.js";
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
    command: "jumbo decision show --id dec_abc123",
    description: "Show the complete decision record",
  },
  {
    command: "jumbo decision show --id dec_abc123 --format json",
    description: "Show the complete decision record as JSON",
  },
];

const RELATED_COMMANDS = ["decisions list", "decisions search", "decision update"];

/**
 * The abstract ports the `decision show` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionShowDependencies {
  readonly showDecisionController: ShowDecisionController;
}

/**
 * Composes exactly the feature the `decision show` leaf uses.
 */
async function createDecisionShowDependencies(): Promise<DecisionShowDependencies> {
  return new LeafContainerBuilder().withShowDecisionFeature().build();
}

/** Registers the `decision show` leaf under the parent supplied by its group. */
export function registerDecisionShowCommand(decision: Command): void {
  const command = decision
    .command("show")
    .description("Display the complete architectural decision record")
    .requiredOption("-i, --id <decisionId>", "ID of the decision to show");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision show",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionShowDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionShowDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision show dependencies were not initialized.");
    await decisionShow(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionShow(
  options: { id: string },
  container: DecisionShowDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionShowOutputBuilder();

  try {
    const { decision } = await container.showDecisionController.handle({
      decisionId: options.id,
    });

    if (renderer.getConfig().format === "text") {
      renderer.info(outputBuilder.build(decision).toHumanReadable());
      return;
    }

    const dataSection = outputBuilder
      .buildStructuredOutput(decision)
      .getSections()
      .find((section) => section.type === "data");

    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output =
      error instanceof Error &&
      error.message === `Decision not found: ${options.id}`
        ? outputBuilder.buildNotFoundError(options.id)
        : outputBuilder.buildFailureError(
            error instanceof Error ? error : String(error),
          );

    renderer.error(output.toHumanReadable());
    process.exitCode = 1;
  }
}
