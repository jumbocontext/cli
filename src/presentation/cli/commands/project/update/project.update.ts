/**
 * CLI Command: jumbo project update
 *
 * Updates project metadata (purpose).
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateProjectController } from "../../../../../application/context/project/update/UpdateProjectController.js";
import { UpdateProjectRequest } from "../../../../../application/context/project/update/UpdateProjectRequest.js";
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
    command: "jumbo project update --purpose 'Updated purpose'",
    description: "Update project purpose",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["project init"];

/**
 * The abstract ports the `project update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ProjectUpdateDependencies {
  readonly updateProjectController: UpdateProjectController;
}

/**
 * Composes exactly the feature the `project update` leaf uses.
 */
async function createProjectUpdateDependencies(): Promise<ProjectUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateProjectFeature().build();
}

/** Registers the `project update` leaf under the parent supplied by its group. */
export function registerProjectUpdateCommand(project: Command): void {
  const command = project
    .command("update")
    .description("Update project metadata")
    .requiredOption("--purpose <purpose>", "Updated project purpose");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "project update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ProjectUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createProjectUpdateDependencies();
  });

  command.action(async (options: { purpose: string }) => {
    if (!dependencies) throw new Error("Project update dependencies were not initialized.");
    await projectUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function projectUpdate(
  options: {
    purpose: string;
  },
  container: ProjectUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: UpdateProjectRequest = {
      purpose: options.purpose,
    };

    const response = await container.updateProjectController.handle(request);

    if (!response.updated) {
      renderer.info("No changes detected (values already match)");
    } else {
      const data: Record<string, string> = {
        updated: response.changedFields.join(", "),
        name: response.name,
      };
      if (response.purpose) {
        data.purpose = response.purpose;
      }

      renderer.success("Project updated successfully", data);
    }
  } catch (error) {
    renderer.error(
      "Failed to update project",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
