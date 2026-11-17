import chalk from "chalk";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Renderer } from "./Renderer.js";
import { Layout } from "./StyleConfig.js";
import { ProjectNotInitializedError } from "../../../application/host/ProjectNotInitializedError.js";

/** Keep initialization guidance concise for people without changing structured errors. */
export function renderProjectNotInitializedError(
  error: ProjectNotInitializedError,
): void {
  const renderer = Renderer.getInstance();
  const { format, forceHuman } = renderer.getConfig();

  if (format === "text" || forceHuman) {
    console.error(
      chalk.hex(BaseColors.brandYellow)(`${Layout.indent}${error.message}`),
    );
    return;
  }

  renderer.error("Command failed", error.message);
}
