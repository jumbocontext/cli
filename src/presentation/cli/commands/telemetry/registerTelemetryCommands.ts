import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerTelemetryStatusCommand } from "./status/telemetry.status.js";
import { registerTelemetryEnableCommand } from "./enable/telemetry.enable.js";
import { registerTelemetryDisableCommand } from "./disable/telemetry.disable.js";

/** Owns the `telemetry` parent command and all leaves beneath it. */
export function registerTelemetryCommands(program: Command): void {
  const telemetry = program
    .command("telemetry")
    .description("Manage anonymous telemetry consent");
  categorizeCommand(telemetry, COMMAND_CATEGORY.host);

  registerTelemetryStatusCommand(telemetry);
  registerTelemetryEnableCommand(telemetry);
  registerTelemetryDisableCommand(telemetry);
}
