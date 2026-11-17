import { access } from "node:fs/promises";
import { ApplicationRoot } from "../application/host/ApplicationRoot.js";
import { CachedContextProject } from "../infrastructure/host/ContextProject.js";
import type { Command } from "commander";
import { LegacyInstallationDetector } from "./LegacyInstallationDetector.js";

/** Temporary startup boundary that blocks ordinary use of legacy project storage. */
export class MigrationGate {
  async assertInvocationAllowed(
    actionCommand: Command,
  ): Promise<MigrationGateResult> {
    if (actionCommand.name() === "migrate") {
      return { kind: "allowed" };
    }

    const contextProject = CachedContextProject.get();
    const projectRoot = contextProject.path;
    const applicationRoot = ApplicationRoot.getInstance();

    try {
      await access(applicationRoot.getProjectDirectory(projectRoot));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const legacyRoot = new LegacyInstallationDetector().find(projectRoot);
      if (legacyRoot) return { kind: "migration-required", projectRoot: legacyRoot };
    }

    return { kind: "allowed" };
  }
}

export type MigrationGateResult =
  | { readonly kind: "allowed" }
  | { readonly kind: "migration-required"; readonly projectRoot: string };
