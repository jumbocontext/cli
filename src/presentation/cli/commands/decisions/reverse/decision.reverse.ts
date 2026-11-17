/**
 * CLI Command: jumbo decision reverse
 *
 * Reverses an architectural decision with a reason.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ReverseDecisionController } from "../../../../../application/context/decisions/reverse/ReverseDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { ReverseDecisionRequest } from "../../../../../application/context/decisions/reverse/ReverseDecisionRequest.js";
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
      'jumbo decision reverse --id dec_123 --reason "Requirements changed"',
    description: "Reverse a decision with reason",
  },
];

const RELATED_COMMANDS = ["decision add", "decision update", "decision supersede"];

/**
 * The abstract ports the `decision reverse` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionReverseDependencies {
  readonly reverseDecisionController: ReverseDecisionController;
}

/**
 * Composes exactly the feature the `decision reverse` leaf uses.
 */
async function createDecisionReverseDependencies(): Promise<DecisionReverseDependencies> {
  return new LeafContainerBuilder().withReverseDecisionFeature().build();
}

/** Registers the `decision reverse` leaf under the parent supplied by its group. */
export function registerDecisionReverseCommand(decision: Command): void {
  const command = decision
    .command("reverse")
    .description("Reverse an architectural decision")
    .requiredOption("-i, --id <id>", "Decision ID to reverse")
    .requiredOption("-r, --reason <reason>", "Reason for reversing the decision");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision reverse",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionReverseDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionReverseDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision reverse dependencies were not initialized.");
    await decisionReverse(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionReverse(
  options: {
    id: string;
    reason: string;
  },
  container: DecisionReverseDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: ReverseDecisionRequest = {
      decisionId: options.id,
      reason: options.reason,
    };

    const response = await container.reverseDecisionController.handle(request);

    // Success output
    renderer.success(`Decision '${response.decisionId}' reversed`);
    renderer.info(`Reason: ${options.reason}`);
  } catch (error) {
    renderer.error(
      "Failed to reverse decision",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
