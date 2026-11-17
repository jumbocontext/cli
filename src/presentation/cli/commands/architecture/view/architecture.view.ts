/**
 * CLI Command: jumbo architecture view
 *
 * Displays the current architecture definition with deprecation notice.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetArchitectureController } from "../../../../../application/context/architecture/get/GetArchitectureController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  ARCHITECTURE_DEPRECATION_NOTICE,
  ARCHITECTURE_MIGRATION_TABLE,
} from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  metaField,
  contentLine,
  divider,
} from "../../../rendering/OutputLayout.js";
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
    command: "jumbo architecture view",
    description: "Show the current architecture definition",
  },
];

const RELATED_COMMANDS = ["decision add", "invariant add", "component add", "dependency add"];

/**
 * The abstract ports the `architecture view` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ArchitectureViewDependencies {
  readonly getArchitectureController: GetArchitectureController;
}

/**
 * Composes exactly the feature the `architecture view` leaf uses.
 */
async function createArchitectureViewDependencies(): Promise<ArchitectureViewDependencies> {
  return new LeafContainerBuilder().withGetArchitectureFeature().build();
}

/** Registers the `architecture view` leaf under the parent supplied by its group. */
export function registerArchitectureViewCommand(architecture: Command): void {
  const command = architecture
    .command("view")
    .description("View current project architecture (deprecated)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "architecture view",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ArchitectureViewDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createArchitectureViewDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("Architecture view dependencies were not initialized.");
    await architectureView(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureView(
  container: ArchitectureViewDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const { architecture } = await container.getArchitectureController.handle(
      {},
    );

    if (!architecture) {
      renderer.info("No architecture defined.");
      return;
    }

    const config = renderer.getConfig();

    if (config.format === "text") {
      const lines: string[] = [];
      lines.push("");
      lines.push(heading("Architecture"));
      lines.push("");
      lines.push(
        metaField("ID", Colors.muted(architecture.architectureId), 14),
      );
      lines.push(
        metaField("Description", Colors.primary(architecture.description), 14),
      );
      lines.push(
        metaField(
          "Organization",
          Colors.primary(architecture.organization),
          14,
        ),
      );
      lines.push(
        metaField("Version", Colors.muted(String(architecture.version)), 14),
      );
      lines.push(
        metaField("Created", Colors.muted(architecture.createdAt), 14),
      );
      lines.push(
        metaField("Updated", Colors.muted(architecture.updatedAt), 14),
      );

      if (architecture.patterns.length > 0) {
        lines.push(
          metaField(
            "Patterns",
            Colors.primary(architecture.patterns.join(", ")),
            14,
          ),
        );
      }
      if (architecture.principles.length > 0) {
        lines.push(
          metaField(
            "Principles",
            Colors.primary(architecture.principles.join(", ")),
            14,
          ),
        );
      }
      if (architecture.stack.length > 0) {
        lines.push(
          metaField("Stack", Colors.primary(architecture.stack.join(", ")), 14),
        );
      }
      if (architecture.dataStores.length > 0) {
        lines.push("");
        lines.push(heading("Data Stores"));
        for (const dataStore of architecture.dataStores) {
          lines.push(
            contentLine(
              `${Colors.primary(dataStore.name)} ${Colors.muted(`(${dataStore.type})`)}: ${dataStore.purpose}`,
            ),
          );
        }
      }

      lines.push("");
      lines.push(divider());
      lines.push(
        contentLine(
          `${Symbols.warning} ${Colors.warning(ARCHITECTURE_DEPRECATION_NOTICE)}`,
        ),
      );
      lines.push(contentLine("Migrate to individual entities:"));
      for (const tableLine of ARCHITECTURE_MIGRATION_TABLE.split("\n")) {
        lines.push(contentLine(tableLine));
      }
      lines.push("");
      renderer.info(lines.join("\n"));
    } else {
      renderer.data({ architecture });
    }
  } catch (error) {
    renderer.error(
      "Failed to view architecture",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
