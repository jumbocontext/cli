/**
 * CLI Command: jumbo telemetry disable
 *
 * Disables anonymous telemetry.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateTelemetryConsentController } from "../../../../../application/context/telemetry/update/UpdateTelemetryConsentController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryDisableOutputBuilder } from "./TelemetryDisableOutputBuilder.js";
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
    command: "jumbo telemetry disable",
    description: "Opt out of anonymous telemetry",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["telemetry status", "telemetry enable"];

/**
 * The abstract ports the `telemetry disable` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface TelemetryDisableDependencies {
  readonly updateTelemetryConsentController: UpdateTelemetryConsentController;
}

/**
 * Composes exactly the features the `telemetry disable` leaf uses.
 */
async function createTelemetryDisableDependencies(): Promise<TelemetryDisableDependencies> {
  return new LeafContainerBuilder().withTelemetryFeature().build();
}

/** Registers the `telemetry disable` leaf under the parent supplied by its group. */
export function registerTelemetryDisableCommand(telemetry: Command): void {
  const command = telemetry
    .command("disable")
    .description("Disable anonymous telemetry");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "telemetry disable",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.host,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: TelemetryDisableDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createTelemetryDisableDependencies();
  });

  command.action(async () => {
    if (!dependencies) {
      throw new Error("Telemetry disable dependencies were not initialized.");
    }
    await telemetryDisable(dependencies);
  });
}

/**
 * Command handler
 * Called by the leaf registration with its composed dependencies
 */
export async function telemetryDisable(container: TelemetryDisableDependencies) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryDisableOutputBuilder();

  try {
    const response = await container.updateTelemetryConsentController.handle({
      enabled: false,
    });
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
