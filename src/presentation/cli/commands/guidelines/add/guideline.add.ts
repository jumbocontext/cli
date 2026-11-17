/**
 * CLI Command: jumbo guideline add
 *
 * Captures an execution guideline for the project (testing, style, process, etc.).
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddGuidelineController } from "../../../../../application/context/guidelines/add/AddGuidelineController.js";
import { AddGuidelineRequest } from "../../../../../application/context/guidelines/add/AddGuidelineRequest.js";
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
    command:
      "jumbo guideline add --category testing --title '80% coverage required' --description 'All new features must have at least 80% test coverage' --rationale 'Ensures code quality and reduces bugs'",
    description: "Add a testing guideline",
  },
  {
    command:
      "jumbo guideline add --category codingStyle --title 'Use TypeScript strict mode' --description 'All TypeScript files must use strict mode' --rationale 'Catches type errors early' --example tsconfig.json --example src/domain/shared/BaseAggregate.ts",
    description: "Add a coding style guideline with examples",
  },
];

const RELATED_COMMANDS = ["guideline update", "guideline remove", "invariant add"];

/**
 * The abstract ports the `guideline add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GuidelineAddDependencies {
  readonly addGuidelineController: AddGuidelineController;
}

/**
 * Composes exactly the features the `guideline add` leaf uses.
 */
async function createGuidelineAddDependencies(): Promise<GuidelineAddDependencies> {
  return new LeafContainerBuilder().withAddGuidelineFeature().build();
}

/** Registers the `guideline add` leaf under the parent supplied by its group. */
export function registerGuidelineAddCommand(guideline: Command): void {
  const command = guideline
    .command("add")
    .description("Add an execution guideline (testing, style, process, etc.)")
    .requiredOption(
      "-c, --category <category>",
      "Category (testing, codingStyle, process, communication, documentation, security, performance, other)",
    )
    .requiredOption("-t, --title <title>", "Guideline title")
    .requiredOption("-d, --description <description>", "Detailed guideline description")
    .requiredOption("--rationale <rationale>", "Why this guideline is important")
    .option(
      "--example <path...>",
      "Example file paths demonstrating the guideline (optional, repeatable)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guideline add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelineAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelineAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guideline add dependencies were not initialized.");
    }
    await guidelineAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineAdd(
  options: {
    category: GuidelineCategoryValue;
    title: string;
    description: string;
    rationale: string;
    example?: string[];
  },
  container: GuidelineAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddGuidelineRequest = {
      category: options.category,
      title: options.title,
      description: options.description,
      rationale: options.rationale,
      examples: options.example,
    };

    const { guidelineId } =
      await container.addGuidelineController.handle(request);

    const data: Record<string, string | number> = {
      guidelineId,
      category: options.category,
      title: options.title,
    };
    if (options.example && options.example.length > 0) {
      data.examples = options.example.length;
    }

    renderer.success(
      `Guideline '${categoryLabel(options.category)}: ${options.title}' added`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to add guideline",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    testing: "Testing",
    codingStyle: "Coding Style",
    process: "Process",
    communication: "Communication",
    documentation: "Documentation",
    security: "Security",
    performance: "Performance",
    other: "Other",
  };
  return labels[category] || category;
}
