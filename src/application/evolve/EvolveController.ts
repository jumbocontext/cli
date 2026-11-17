import { IAgentFileProtocol } from "../context/project/init/IAgentFileProtocol.js";
import { ILogger } from "../logging/ILogger.js";
import { IDatabaseRebuildService } from "../maintenance/db/rebuild/IDatabaseRebuildService.js";
import { MigrateDependenciesCommandHandler } from "../maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { UpgradeCommandHandler } from "../maintenance/upgrade/UpgradeCommandHandler.js";
import { ISettingsInitializer } from "../settings/ISettingsInitializer.js";
import { EvolveResponse } from "./EvolveResponse.js";
import { EvolveStepResult } from "./EvolveStepResult.js";

type SchemaMigrationAction = () => void | Promise<void>;

export class EvolveController {
  private readonly tag = "[EvolveController]";

  constructor(
    private readonly runSchemaMigrations: SchemaMigrationAction,
    private readonly upgradeCommandHandler: UpgradeCommandHandler,
    private readonly migrateDependenciesCommandHandler: MigrateDependenciesCommandHandler,
    private readonly projectRoot: string,
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer,
    private readonly databaseRebuildService: IDatabaseRebuildService,
    private readonly logger: ILogger,
  ) {}

  async handle(): Promise<EvolveResponse> {
    this.logger.info(`${this.tag} Starting evolve`);
    const steps: EvolveStepResult[] = [];
    const projectRoot = this.projectRoot;
    this.logger.debug(`${this.tag} Using project root`, { projectRoot });

    const schemaMigrationSucceeded = await this.runStep(
      steps,
      "Schema migrations",
      async () => {
        await this.runSchemaMigrations();
      },
      "Applied pending schema migrations.",
    );

    const goalStatusMigrationSucceeded = schemaMigrationSucceeded
      ? await this.runStep(steps, "Goal status migration", async () => {
          const response = await this.upgradeCommandHandler.handle({
            from: "v1",
            to: "v2",
          });
          return `${response.migratedGoals} goals migrated, ${response.eventsAppended} events appended.`;
        })
      : this.addSkippedStep(
          steps,
          "Goal status migration",
          "Skipped because schema migrations failed.",
        );

    const dependencyMigrationSucceeded = schemaMigrationSucceeded
      ? await this.runStep(steps, "Legacy dependency migration", async () => {
          const response = await this.migrateDependenciesCommandHandler.handle({
            dryRun: false,
          });
          return `${response.converted.length} converted, ${response.skipped.length} skipped.`;
        })
      : this.addSkippedStep(
          steps,
          "Legacy dependency migration",
          "Skipped because schema migrations failed.",
        );

    await this.runStep(
      steps,
      "JUMBO.md",
      async () => {
        await this.agentFileProtocol.repairJumboMd(projectRoot);
      },
      "Updated Jumbo instructions in JUMBO.md.",
    );

    await this.runStep(
      steps,
      "AGENTS.md",
      async () => {
        await this.agentFileProtocol.repairAgentsMd(projectRoot);
      },
      "Updated Jumbo instructions in AGENTS.md.",
    );

    const agentConfigurationStep = await this.executeStep(async () => {
      await this.agentFileProtocol.repairAgentConfigurations(projectRoot);
    });
    steps.push(
      this.createStepResult(
        "Agent configuration files",
        agentConfigurationStep,
        "Updated CLAUDE.md, GEMINI.md, copilot-instructions.md, and other managed agent files.",
      ),
    );
    steps.push(
      this.createStepResult(
        "Managed skills",
        agentConfigurationStep,
        "Synced Jumbo-managed skills from assets/skills/.",
      ),
    );
    steps.push(
      this.createStepResult(
        "Harness configurations",
        agentConfigurationStep,
        "Updated managed harness and hook configurations.",
      ),
    );

    await this.runStep(
      steps,
      "Settings",
      async () => {
        await this.settingsInitializer.ensureSettingsFileExists();
      },
      "Ensured settings files are current.",
    );

    if (
      schemaMigrationSucceeded &&
      goalStatusMigrationSucceeded &&
      dependencyMigrationSucceeded
    ) {
      await this.runStep(steps, "Database projections", async () => {
        const response = await this.databaseRebuildService.rebuild();
        return `${response.eventsReplayed} events replayed.`;
      });
    } else {
      this.addSkippedStep(
        steps,
        "Database projections",
        "Skipped because one or more database migration steps failed.",
      );
    }

    const failedSteps = steps.filter((s) => s.status === "failed");
    if (failedSteps.length > 0) {
      this.logger.warn(
        `${this.tag} Evolve completed with ${failedSteps.length} failed step(s)`,
        {
          failed: failedSteps.map((s) => s.name),
        },
      );
    } else {
      this.logger.info(`${this.tag} Evolve completed successfully`, {
        totalSteps: steps.length,
      });
    }

    return { steps };
  }

  private async runStep(
    steps: EvolveStepResult[],
    name: string,
    operation: () => Promise<string | void>,
    successDetail?: string,
  ): Promise<boolean> {
    this.logger.debug(`${this.tag} Running step: ${name}`);
    const result = await this.executeStep(operation);
    const stepResult = this.createStepResult(name, result, successDetail);
    steps.push(stepResult);
    if (stepResult.status === "failed") {
      this.logger.error(`${this.tag} Step failed: ${name}`, undefined, {
        detail: stepResult.detail,
      });
    } else {
      this.logger.debug(`${this.tag} Step completed: ${name}`, {
        status: stepResult.status,
        detail: stepResult.detail,
      });
    }
    return result.status === "repaired";
  }

  private async executeStep(
    operation: () => Promise<string | void>,
  ): Promise<{ status: "repaired" | "failed"; detail?: string }> {
    try {
      const detail = await operation();
      return {
        status: "repaired",
        detail: typeof detail === "string" ? detail : undefined,
      };
    } catch (error) {
      this.logger.error(
        `${this.tag} Step execution error`,
        error instanceof Error ? error : undefined,
        {
          errorValue: error instanceof Error ? undefined : String(error),
        },
      );
      return {
        status: "failed",
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private addSkippedStep(
    steps: EvolveStepResult[],
    name: string,
    detail: string,
  ): false {
    steps.push({
      name,
      status: "skipped",
      detail,
    });
    return false;
  }

  private createStepResult(
    name: string,
    result: { status: "repaired" | "failed"; detail?: string },
    successDetail?: string,
  ): EvolveStepResult {
    if (result.status === "failed") {
      return {
        name,
        status: "failed",
        detail: result.detail,
      };
    }

    return {
      name,
      status: "repaired",
      detail: result.detail ?? successDetail,
    };
  }
}
