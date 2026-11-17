/**
 * CLI Command: jumbo decision remove
 *
 * Permanently removes a decision and prunes its relations.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveDecisionController } from "../../../../../application/context/decisions/remove/RemoveDecisionController.js";
import type { ILogger } from "../../../../../application/logging/ILogger.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import type { RemoveDecisionRequest } from "../../../../../application/context/decisions/remove/RemoveDecisionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import type { RenderData } from "../../../rendering/types.js";
import { DecisionRemoveOutputBuilder } from "./DecisionRemoveOutputBuilder.js";
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
    command: "jumbo decision remove --id dec_123",
    description: "Remove a decision and its relations",
  },
  {
    command: "jumbo decision remove --id dec_123 --format json",
    description: "Return the removal result as JSON",
  },
];

const RELATED_COMMANDS = ["decision show", "decision reverse", "decisions list"];

/**
 * The abstract ports the `decision remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionRemoveDependencies {
  readonly removeDecisionController: RemoveDecisionController;
  readonly logger: ILogger;
}

/**
 * Composes exactly the feature the `decision remove` leaf uses.
 */
async function createDecisionRemoveDependencies(): Promise<DecisionRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveDecisionFeature().build();
}

/** Registers the `decision remove` leaf under the parent supplied by its group. */
export function registerDecisionRemoveCommand(decision: Command): void {
  const command = decision
    .command("remove")
    .description("Permanently remove a decision and prune its relations")
    .requiredOption("-i, --id <id>", "Decision ID to remove");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision remove dependencies were not initialized.");
    await decisionRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionRemove(
  options: { id: string },
  container: DecisionRemoveDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionRemoveOutputBuilder();

  try {
    const request: RemoveDecisionRequest = { decisionId: options.id };
    const response = await container.removeDecisionController.handle(request);
    const output = outputBuilder.buildSuccess(response);
    if (renderer.getConfig().format === "text") {
      renderer.banner([output.toHumanReadable()]);
    } else {
      const data = output
        .getSections()
        .find((section) => section.type === "data")?.content;
      renderer.data(data as RenderData);
    }
  } catch (error) {
    container.logger.error("decision.remove failed", error, {
      decisionId: options.id,
    });
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    if (renderer.getConfig().format === "text") {
      console.error(output.toHumanReadable());
    } else {
      const data = output
        .getSections()
        .find((section) => section.type === "data")?.content;
      renderer.data(data as RenderData);
    }
    process.exit(1);
  }
}
