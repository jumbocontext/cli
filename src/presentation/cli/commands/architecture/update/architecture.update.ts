/**
 * CLI Command: jumbo architecture update
 *
 * DEPRECATED: This command rejects execution when the Architecture entity
 * is deprecated, with migration guidance directing to individual entities.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateArchitectureController } from "../../../../../application/context/architecture/update/UpdateArchitectureController.js";
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
      "jumbo architecture update --pattern DDD CQRS EventSourcing --principle SOLID DRY",
    description: "Update architecture patterns and principles",
  },
];

const RELATED_COMMANDS = ["decision add", "invariant add", "component add", "dependency add"];

/**
 * The abstract ports the `architecture update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ArchitectureUpdateDependencies {
  readonly updateArchitectureController: UpdateArchitectureController;
}

/**
 * Composes exactly the feature the `architecture update` leaf uses.
 */
async function createArchitectureUpdateDependencies(): Promise<ArchitectureUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateArchitectureFeature().build();
}

/** Registers the `architecture update` leaf under the parent supplied by its group. */
export function registerArchitectureUpdateCommand(
  architecture: Command,
): void {
  const command = architecture
    .command("update")
    .description("Update project architecture details (deprecated)")
    .option("-d, --description <description>", "High-level architectural overview")
    .option(
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
      path: "architecture update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ArchitectureUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createArchitectureUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Architecture update dependencies were not initialized.",
      );
    await architectureUpdate(options, dependencies);
  });
}

/**
 * Command handler — delegates to controller; rejects with migration guidance
 * when the Architecture entity is deprecated.
 */
export async function architectureUpdate(
  options: {
    description?: string;
    organization?: string;
    pattern?: string[];
    principle?: string[];
    dataStore?: string[];
    stack?: string[];
  },
  container: ArchitectureUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    await container.updateArchitectureController.handle({
      description: options.description,
      organization: options.organization,
      patterns: options.pattern,
      principles: options.principle,
      dataStores: options.dataStore,
      stack: options.stack,
    });

    renderer.success("Architecture updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === ArchitectureErrorMessages.DEPRECATED) {
      renderer.error(ARCHITECTURE_REJECTION_MESSAGE);
    } else {
      renderer.error(
        "Failed to update architecture",
        error instanceof Error ? error : String(error),
      );
    }
    process.exit(1);
  }
}
