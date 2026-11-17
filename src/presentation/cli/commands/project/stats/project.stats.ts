/**
 * CLI Command: jumbo project stats
 *
 * Shows aggregated project statistics across goals, components, audiences,
 * decisions, and other project knowledge entities.
 */

import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ProjectStatsController } from "../../../../../application/context/project/stats/ProjectStatsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import type { RenderData } from "../../../rendering/types.js";
import { OUTPUT_FORMAT } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { ProjectStatsOutputBuilder } from "./ProjectStatsOutputBuilder.js";
import type { Command } from "commander";

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo project stats",
    description: "Show project statistics",
  },
  {
    command: "jumbo project stats --format json",
    description: "Show project statistics as JSON",
  },
];

const RELATED_COMMANDS = ["project show", "goals list", "relations list"];

/**
 * The abstract ports the `project stats` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ProjectStatsDependencies {
  readonly projectStatsController: ProjectStatsController;
}

/**
 * Composes exactly the feature the `project stats` leaf uses.
 */
async function createProjectStatsDependencies(): Promise<ProjectStatsDependencies> {
  return new LeafContainerBuilder().withProjectStatsFeature().build();
}

/** Registers the `project stats` leaf under the parent supplied by its group. */
export function registerProjectStatsCommand(project: Command): void {
  const command = project
    .command("stats")
    .description("Show project statistics");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "project stats",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ProjectStatsDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createProjectStatsDependencies();
  });

  command.action(async () => {
    if (!dependencies) throw new Error("Project stats dependencies were not initialized.");
    await projectStats({}, dependencies);
  });
}

export async function projectStats(
  _options: Record<string, never>,
  container: ProjectStatsDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.projectStatsController.handle({
      currentOnly: true,
    });
    const config = renderer.getConfig();
    const outputBuilder = new ProjectStatsOutputBuilder();
    const output =
      config.format === OUTPUT_FORMAT.text
        ? outputBuilder.build(response.snapshot)
        : outputBuilder.buildStructured(response.snapshot);

    if (config.format === OUTPUT_FORMAT.text) {
      renderer.info(output.toHumanReadable());
      return;
    }

    const dataSection = output.getSections().find((s) => s.type === "data");
    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to show project stats",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
