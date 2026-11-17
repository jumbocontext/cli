/**
 * CLI Command: jumbo telemetry enable
 *
 * Enables anonymous telemetry and generates an anonymous ID if needed.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateTelemetryConsentController } from "../../../../../application/context/telemetry/update/UpdateTelemetryConsentController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryEnableOutputBuilder } from "./TelemetryEnableOutputBuilder.js";
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
    command: "jumbo telemetry enable",
    description: "Opt into anonymous telemetry",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["telemetry status", "telemetry disable"];

/**
 * The abstract ports the `telemetry enable` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface TelemetryEnableDependencies {
  readonly updateTelemetryConsentController: UpdateTelemetryConsentController;
}

/**
 * Composes exactly the features the `telemetry enable` leaf uses.
 */
async function createTelemetryEnableDependencies(): Promise<TelemetryEnableDependencies> {
  return new LeafContainerBuilder().withTelemetryFeature().build();
}

/** Registers the `telemetry enable` leaf under the parent supplied by its group. */
export function registerTelemetryEnableCommand(telemetry: Command): void {
  const command = telemetry
    .command("enable")
    .description("Enable anonymous telemetry and generate an anonymous ID if needed");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "telemetry enable",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.host,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: TelemetryEnableDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createTelemetryEnableDependencies();
  });

  command.action(async () => {
    if (!dependencies) {
      throw new Error("Telemetry enable dependencies were not initialized.");
    }
    await telemetryEnable(dependencies);
  });
}

/**
 * Command handler
 * Called by the leaf registration with its composed dependencies
 */
export async function telemetryEnable(container: TelemetryEnableDependencies) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryEnableOutputBuilder();

  try {
    const response = await container.updateTelemetryConsentController.handle({
      enabled: true,
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
