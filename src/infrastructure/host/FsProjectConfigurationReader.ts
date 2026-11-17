import { readFile } from "node:fs/promises";
import type { ProjectConfiguration } from "../../application/host/ProjectConfiguration.js";

/** Discovery never creates settings, supplies defaults, or repairs identity. */
export class FsProjectConfigurationReader {
  async read(settingsFile: string): Promise<ProjectConfiguration> {
    const settings = JSON.parse(await readFile(settingsFile, "utf8"));
    const projectId = settings?.project?.id;
    const backend = settings?.connection?.backend;
    if (
      typeof projectId !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(projectId) ||
      (backend !== "local" && backend !== "remote")
    ) {
      throw new Error(`Invalid project configuration at ${settingsFile}`);
    }
    return { projectId, connection: { backend } };
  }
}
