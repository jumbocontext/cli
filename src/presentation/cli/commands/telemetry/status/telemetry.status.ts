/**
 * CLI Command: jumbo telemetry status
 *
 * Shows telemetry consent and effective runtime status.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetTelemetryStatusController } from "../../../../../application/context/telemetry/get/GetTelemetryStatusController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryStatusOutputBuilder } from "./TelemetryStatusOutputBuilder.js";
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
    command: "jumbo telemetry status",
    description: "Show current telemetry consent and anonymous ID",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["telemetry enable", "telemetry disable"];

/**
 * The abstract ports the `telemetry status` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface TelemetryStatusDependencies {
  readonly getTelemetryStatusController: GetTelemetryStatusController;
}

/**
 * Composes exactly the features the `telemetry status` leaf uses.
 */
async function createTelemetryStatusDependencies(): Promise<TelemetryStatusDependencies> {
  return new LeafContainerBuilder().withTelemetryFeature().build();
}

/** Registers the `telemetry status` leaf under the parent supplied by its group. */
export function registerTelemetryStatusCommand(telemetry: Command): void {
  const command = telemetry
    .command("status")
    .description("Show telemetry consent and effective runtime status");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "telemetry status",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.host,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: TelemetryStatusDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createTelemetryStatusDependencies();
  });

  command.action(async () => {
    if (!dependencies) {
      throw new Error("Telemetry status dependencies were not initialized.");
    }
    await telemetryStatus(dependencies);
  });
}

/**
 * Command handler
 * Called by the leaf registration with its composed dependencies
 */
export async function telemetryStatus(container: TelemetryStatusDependencies) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryStatusOutputBuilder();

  try {
    const response = await container.getTelemetryStatusController.handle({});
    const output = outputBuilder.buildSuccess(response);

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
