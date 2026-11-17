import chalk from "chalk";
import type { MigrationRequiredError } from "../../../application/host/MigrationRequiredError.js";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Renderer } from "./Renderer.js";
import { Layout } from "./StyleConfig.js";

/** Keep migration guidance concise for people without changing structured errors. */
export function renderMigrationRequiredError(error: MigrationRequiredError): void {
  const renderer = Renderer.getInstance();
  const { format, forceHuman } = renderer.getConfig();
  if (format === "text" || forceHuman) {
    console.error(
      chalk.hex(BaseColors.brandYellow)(`${Layout.indent}${error.message}`),
    );
  } else {
    renderer.error("Command failed", error.message);
  }
}
