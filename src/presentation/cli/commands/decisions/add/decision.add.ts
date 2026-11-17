/**
 * CLI Command: jumbo decision add
 *
 * Adds a new architectural decision record (ADR) to track strategic choices
 * made during system design with their rationale, alternatives, and consequences.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddDecisionController } from "../../../../../application/context/decisions/add/AddDecisionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { AddDecisionRequest } from "../../../../../application/context/decisions/add/AddDecisionRequest.js";
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
      'jumbo decision add --title "Use JWT tokens" --context "Need stateless auth"',
    description: "Add a decision with title and context",
  },
  {
    command:
      'jumbo decision add --title "Use JWT" --context "Need auth" --rationale "Scalable" --alternative "Sessions" --alternative "OAuth2"',
    description: "Add decision with alternatives",
  },
];

const RELATED_COMMANDS = ["decision update", "decision reverse", "decision supersede"];

/**
 * The abstract ports the `decision add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface DecisionAddDependencies {
  readonly addDecisionController: AddDecisionController;
}

/**
 * Composes exactly the feature the `decision add` leaf uses.
 */
async function createDecisionAddDependencies(): Promise<DecisionAddDependencies> {
  return new LeafContainerBuilder().withAddDecisionFeature().build();
}

/** Registers the `decision add` leaf under the parent supplied by its group. */
export function registerDecisionAddCommand(decision: Command): void {
  const command = decision
    .command("add")
    .description("Add a new architectural decision record (ADR)")
    .requiredOption("-t, --title <title>", "Decision title")
    .requiredOption("--context <context>", "Context and problem statement")
    .option("--rationale <text>", "Rationale for the decision")
    .option(
      "--alternative <items...>",
      "Alternatives considered (can specify multiple)",
    )
    .option("--consequences <text>", "Consequences of this decision");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decision add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decision add dependencies were not initialized.");
    await decisionAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionAdd(
  options: {
    title: string;
    context: string;
    rationale?: string;
    alternative?: string[];
    consequences?: string;
  },
  container: DecisionAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddDecisionRequest = {
      title: options.title,
      context: options.context,
      rationale: options.rationale,
      alternatives: options.alternative,
      consequences: options.consequences,
    };

    const response = await container.addDecisionController.handle(request);

    // Success output
    renderer.success(
      `Decision '${options.title}' added (${response.decisionId})`,
    );
    if (options.rationale) {
      const preview =
        options.rationale.length > 100
          ? options.rationale.substring(0, 100) + "..."
          : options.rationale;
      renderer.info(`Rationale: ${preview}`);
    }
  } catch (error) {
    renderer.error(
      "Failed to add decision",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
