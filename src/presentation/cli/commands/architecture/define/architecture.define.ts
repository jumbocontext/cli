/**
 * CLI Command: jumbo architecture define
 *
 * DEPRECATED: This command rejects execution when the Architecture entity
 * is deprecated, with migration guidance directing to individual entities.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { DefineArchitectureController } from "../../../../../application/context/architecture/define/DefineArchitectureController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ArchitectureErrorMessages } from "../../../../../domain/architecture/Constants.js";
import { ARCHITECTURE_REJECTION_MESSAGE } from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";
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
      'jumbo architecture define --description "Event-sourced DDD system" --organization "Clean Architecture" --pattern DDD CQRS --stack TypeScript Node.js',
    description: "Define architecture with patterns and stack",
  },
];

const RELATED_COMMANDS = ["decision add", "invariant add", "component add", "dependency add"];

/**
 * The abstract ports the `architecture define` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ArchitectureDefineDependencies {
  readonly defineArchitectureController: DefineArchitectureController;
}

/**
 * Composes exactly the feature the `architecture define` leaf uses.
 */
async function createArchitectureDefineDependencies(): Promise<ArchitectureDefineDependencies> {
  return new LeafContainerBuilder().withDefineArchitectureFeature().build();
}

/** Registers the `architecture define` leaf under the parent supplied by its group. */
export function registerArchitectureDefineCommand(
  architecture: Command,
): void {
  const command = architecture
    .command("define")
    .description("Define project architecture (deprecated)")
    .requiredOption(
      "-d, --description <description>",
      "High-level architectural overview",
    )
    .requiredOption(
      "--organization <organization>",
      "Architectural organization (e.g., 'Clean Architecture', 'Hexagonal')",
    )
    .option("--pattern <patterns...>", "Architectural patterns used")
    .option("--principle <principles...>", "Design principles followed")
    .option(
      "--data-store <dataStores...>",
      "Data stores (format: name:type:purpose)",
    )
    .option("--stack <stack...>", "Technology stack items");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "architecture define",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ArchitectureDefineDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createArchitectureDefineDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Architecture define dependencies were not initialized.",
      );
    await architectureDefine(options, dependencies);
  });
}

/**
 * Command handler — delegates to controller; rejects with migration guidance
 * when the Architecture entity is deprecated.
 */
export async function architectureDefine(
  options: {
    description: string;
    organization: string;
    pattern?: string[];
    principle?: string[];
    dataStore?: string[];
    stack?: string[];
  },
  container: ArchitectureDefineDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const result = await container.defineArchitectureController.handle({
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack,
    });

    renderer.success(`Architecture defined successfully`);
    renderer.info(`Architecture ID: ${result.architectureId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === ArchitectureErrorMessages.DEPRECATED) {
      renderer.error(ARCHITECTURE_REJECTION_MESSAGE);
    } else {
      renderer.error(
        "Failed to define architecture",
        error instanceof Error ? error : String(error),
      );
    }
    process.exit(1);
  }
}
