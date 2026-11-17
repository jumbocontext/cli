/**
 * CLI Command: jumbo components list
 *
 * Lists all software components with optional status filtering.
 *
 * Usage:
 *   jumbo components list
 *   jumbo components list --status active
 *   jumbo components list --status deprecated --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetComponentsController } from "../../../../../application/context/components/list/GetComponentsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { ComponentStatusFilter } from "../../../../../application/context/components/get/IComponentViewReader.js";
import { GetComponentsRequest } from "../../../../../application/context/components/list/GetComponentsRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { ComponentListOutputBuilder } from "./ComponentListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo components list",
    description: "List all components",
  },
  {
    command: "jumbo components list --status active",
    description: "List only active components",
  },
  {
    command: "jumbo components list --status deprecated --format json",
    description: "List deprecated components as JSON",
  },
];

const RELATED_COMMANDS = [
  "component add",
  "component update",
  "component deprecate",
  "component remove",
];

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is ComponentStatusFilter {
  return ["active", "deprecated", "removed", "all"].includes(status);
}

/**
 * The abstract ports the `components list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ComponentsListDependencies {
  readonly getComponentsController: GetComponentsController;
}

/**
 * Composes exactly the feature the `components list` leaf uses.
 */
async function createComponentsListDependencies(): Promise<ComponentsListDependencies> {
  return new LeafContainerBuilder().withGetComponentsFeature().build();
}

/** Registers the `components list` leaf under the parent supplied by its group. */
export function registerComponentsListCommand(components: Command): void {
  const command = components
    .command("list")
    .description("List all software components")
    .option(
      "-s, --status <status>",
      "Filter by status: active, deprecated, removed, or all (default: all)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "components list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentsListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Components list dependencies were not initialized.");
    await componentsList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentsList(
  options: { status?: string },
  container: ComponentsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(
        `Invalid status: ${statusFilter}. Must be one of: active, deprecated, removed, all`,
      );
      process.exit(1);
    }

    // Execute query via controller
    const request: GetComponentsRequest = { status: statusFilter };
    const { components } =
      await container.getComponentsController.handle(request);

    if (components.length === 0) {
      const filterMsg =
        statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(
        `No components found${filterMsg}. Use 'jumbo component add' to add one.`,
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const outputBuilder = new ComponentListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(components, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        components,
        statusFilter,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list components",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
