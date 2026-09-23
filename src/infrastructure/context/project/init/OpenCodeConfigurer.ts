import fs from "fs-extra";
import path from "path";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";
import { IConfigurer } from "./IConfigurer.js";

export class OpenCodeConfigurer implements IConfigurer {
  readonly agent = {
    id: "opencode",
    name: "OpenCode",
  } as const;

  readonly skillPlatforms = [".agents/skills"] as const;

  private readonly pluginContent = AgentFileAssetContent.readScript(
    "opencode-jumbo-plugin.js",
  );

  async configure(projectRoot: string): Promise<void> {
    await this.writePlugin(projectRoot, false);
  }

  async repair(projectRoot: string): Promise<void> {
    await this.writePlugin(projectRoot, true);
  }

  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const pluginPath = this.getPluginPath(projectRoot);
    const exists = await fs.pathExists(pluginPath);

    return [
      {
        path: ".opencode/plugins/jumbo.js",
        action: exists ? "modify" : "create",
        description: exists
          ? "Refresh Jumbo's OpenCode compaction lifecycle plugin"
          : "Add Jumbo's OpenCode compaction lifecycle plugin",
      },
    ];
  }

  private async writePlugin(
    projectRoot: string,
    force: boolean,
  ): Promise<void> {
    const pluginPath = this.getPluginPath(projectRoot);
    if (!force && (await fs.pathExists(pluginPath))) {
      return;
    }

    await fs.ensureDir(path.dirname(pluginPath));
    await fs.writeFile(pluginPath, this.pluginContent, "utf-8");
  }

  private getPluginPath(projectRoot: string): string {
    return path.join(projectRoot, ".opencode", "plugins", "jumbo.js");
  }
}
