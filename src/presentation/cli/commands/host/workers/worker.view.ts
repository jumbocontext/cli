/**
 * CLI Command: jumbo worker view
 *
 * Displays the current worker's profile including identity and claim settings.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ViewWorkerController } from "../../../../../application/context/host/workers/view/ViewWorkerController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { Colors } from "../../../rendering/StyleConfig.js";
import { heading, metaField } from "../../../rendering/OutputLayout.js";
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
    command: "jumbo worker view",
    description: "Show current worker identity and claim settings",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal start", "goal show"];

/**
 * The abstract ports the `worker view` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface WorkerViewDependencies {
  readonly viewWorkerController: ViewWorkerController;
}

/**
 * Composes exactly the features the `worker view` leaf uses.
 */
async function createWorkerViewDependencies(): Promise<WorkerViewDependencies> {
  return new LeafContainerBuilder().withViewWorkerFeature().build();
}

/** Registers the `worker view` leaf under the parent supplied by its group. */
export function registerWorkerViewCommand(worker: Command): void {
  const command = worker
    .command("view")
    .description("Display current worker profile");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "worker view",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.host,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: WorkerViewDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createWorkerViewDependencies();
  });

  command.action(async () => {
    if (!dependencies) {
      throw new Error("Worker view dependencies were not initialized.");
    }
    await workerView(dependencies);
  });
}

/**
 * Command handler
 * Called by the leaf registration with its composed dependencies
 */
export async function workerView(container: WorkerViewDependencies) {
  const renderer = Renderer.getInstance();

  try {
    const { workerId, claimDurationMinutes } =
      await container.viewWorkerController.handle({});

    // For TTY (human): display formatted text
    // For pipe/file (machine): output structured JSON
    if (process.stdout.isTTY) {
      const lines: string[] = [];
      lines.push("");
      lines.push(heading("Worker Profile"));
      lines.push("");
      lines.push(metaField("Worker ID", Colors.primary(workerId), 16));
      lines.push(
        metaField(
          "Claim Duration",
          Colors.primary(`${claimDurationMinutes} minutes`),
          16,
        ),
      );
      lines.push("");
      renderer.info(lines.join("\n"));
    } else {
      // Structured output for programmatic consumers
      renderer.data({
        workerId,
        claimDurationMinutes,
      });
    }
  } catch (error) {
    renderer.error(
      "Failed to view worker profile",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
