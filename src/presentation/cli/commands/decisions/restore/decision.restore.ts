/**
 * CLI Command: jumbo decision restore
 *
 * Restores a reversed or superseded decision.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RestoreDecisionController } from "../../../../../application/context/decisions/restore/RestoreDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { DecisionRestoreOutputBuilder } from "./DecisionRestoreOutputBuilder.js";
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
      'jumbo decision restore --id dec_123 --reason "Decision remains valid"',
    description: "Restore a reversed or superseded decision",
  },
];

const RELATED_COMMANDS = ["decision reverse", "decision supersede", "decision update"];

/**
 * The abstract ports the `decision restore` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionRestoreDependencies {
  readonly restoreDecisionController: RestoreDecisionController;
}

/**
 * Composes exactly the feature the `decision restore` leaf uses.
 */
async function createDecisionRestoreDependencies(): Promise<DecisionRestoreDependencies> {
  return new LeafContainerBuilder().withRestoreDecisionFeature().build();
}

/** Registers the `decision restore` leaf under the parent supplied by its group. */
export function registerDecisionRestoreCommand(decision: Command): void {
  const command = decision
    .command("restore")
    .description("Restore a reversed or superseded decision")
    .requiredOption("-i, --id <id>", "Decision ID to restore")
    .requiredOption("-r, --reason <reason>", "Reason for restoring the decision");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision restore",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionRestoreDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionRestoreDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision restore dependencies were not initialized.");
    await decisionRestore(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionRestore(
  options: {
    id: string;
    reason: string;
  },
  container: DecisionRestoreDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionRestoreOutputBuilder();

  try {
    const response = await container.restoreDecisionController.handle({
      decisionId: options.id,
      reason: options.reason,
    });

    const output = outputBuilder.buildSuccess(
      response.decisionId,
      options.reason,
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
