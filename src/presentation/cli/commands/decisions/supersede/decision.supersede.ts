/**
 * CLI Command: jumbo decision supersede
 *
 * Marks an existing decision as superseded by a newer decision.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SupersedeDecisionController } from "../../../../../application/context/decisions/supersede/SupersedeDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
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
    command: "jumbo decision supersede --id dec_123 --superseded-by dec_456",
    description: "Mark a decision as superseded by another",
  },
];

const RELATED_COMMANDS = ["decision add", "decision reverse", "decision update"];

/**
 * The abstract ports the `decision supersede` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface DecisionSupersedeDependencies {
  readonly supersedeDecisionController: SupersedeDecisionController;
}

/**
 * Composes exactly the feature the `decision supersede` leaf uses.
 */
async function createDecisionSupersedeDependencies(): Promise<DecisionSupersedeDependencies> {
  return new LeafContainerBuilder().withSupersedeDecisionFeature().build();
}

/** Registers the `decision supersede` leaf under the parent supplied by its group. */
export function registerDecisionSupersedeCommand(decision: Command): void {
  const command = decision
    .command("supersede")
    .description("Mark a decision as superseded by a newer decision")
    .requiredOption("-i, --id <id>", "ID of the decision to supersede")
    .requiredOption("--superseded-by <id>", "ID of the superseding decision");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision supersede",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionSupersedeDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionSupersedeDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Decision supersede dependencies were not initialized.",
      );
    await decisionSupersede(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionSupersede(
  options: {
    id: string;
    supersededBy: string;
  },
  container: DecisionSupersedeDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.supersedeDecisionController.handle({
      decisionId: options.id,
      supersededBy: options.supersededBy,
    });

    renderer.success(
      `Decision '${response.decisionId}' superseded by '${options.supersededBy}'`,
    );
  } catch (error) {
    renderer.error(
      "Failed to supersede decision",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
