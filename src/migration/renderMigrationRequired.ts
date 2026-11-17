import chalk from "chalk";
import { BaseColors } from "../presentation/shared/DesignTokens.js";
import { Renderer } from "../presentation/cli/rendering/Renderer.js";
import { Layout } from "../presentation/cli/rendering/StyleConfig.js";

/** Render concise migration guidance without exposing migration errors to the host. */
export function renderMigrationRequired(projectRoot: string): void {
  const instruction = `Run \`jumbo migrate\` from ${projectRoot}.`;
  const reason =
    "This project's legacy Jumbo data has not been migrated to the application root.";
  const renderer = Renderer.getInstance();
  const { format, forceHuman } = renderer.getConfig();

  if (format === "text" || forceHuman) {
    console.error(chalk.hex(BaseColors.brandYellow)(`${Layout.indent}${instruction} ${reason}`));
    return;
  }

  renderer.error("Command failed", `${instruction} ${reason}`);
}
