/**
 * CLI Command: jumbo project show
 *
 * Shows core project metadata or the project north-star packet.
 */

import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ShowProjectController } from "../../../../../application/context/project/show/ShowProjectController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData, OUTPUT_FORMAT } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { ProjectShowOutputBuilder } from "./ProjectShowOutputBuilder.js";
import type { Command } from "commander";

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo project show",
    description: "Show core project fields",
  },
  {
    command: "jumbo project show --northstar --format json",
    description: "Show project alignment packet as JSON",
  },
];

const RELATED_COMMANDS = [
  "project update",
  "audiences list",
  "audiencePains list",
  "values list",
];

/**
 * The abstract ports the `project show` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ShowProjectDependencies {
  readonly showProjectController: ShowProjectController;
}

/**
 * Composes exactly the feature the `project show` leaf uses.
 */
async function createProjectShowDependencies(): Promise<ShowProjectDependencies> {
  return new LeafContainerBuilder().withShowProjectFeature().build();
}

/** Registers the `project show` leaf under the parent supplied by its group. */
export function registerProjectShowCommand(project: Command): void {
  const command = project
    .command("show")
    .description("Show project metadata")
    .option("--northstar", "Return project alignment context for goal design");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "project show",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ShowProjectDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createProjectShowDependencies();
  });

  command.action(async (options: { northstar?: boolean }) => {
    if (!dependencies) throw new Error("Project show dependencies were not initialized.");
    await projectShow(options, dependencies);
  });
}

export async function projectShow(
  options: { northstar?: boolean },
  container: ShowProjectDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.showProjectController.handle({
      northstar: options.northstar === true,
    });

    const config = renderer.getConfig();
    const outputBuilder = new ProjectShowOutputBuilder();
    const output = options.northstar
      ? config.format === OUTPUT_FORMAT.text
        ? outputBuilder.buildNorthStar(response.northStar)
        : outputBuilder.buildStructuredNorthStar(response.northStar)
      : config.format === OUTPUT_FORMAT.text
        ? outputBuilder.build(response.project)
        : outputBuilder.buildStructuredProject(response.project);

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
      "Failed to show project",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
