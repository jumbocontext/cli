import { realpathSync } from "node:fs";
import { GetProjectSummaryQueryHandler } from "../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import type { ISettingsReader } from "../../application/settings/ISettingsReader.js";
import type { CliUpdateController } from "../../application/cli-metadata/update/CliUpdateController.js";
import type { ILogger } from "../../application/logging/ILogger.js";
import { LeafContainerBuilder } from "../../infrastructure/host/LeafContainerBuilder.js";
import { NodeWorkerDaemonProcessController } from "../../infrastructure/daemons/NodeWorkerDaemonProcessController.js";
import { ApplicationLauncher } from "./application-shell/ApplicationLauncher.js";
import type { ApplicationLauncherDependencies } from "./application-shell/ApplicationLauncherDependencies.js";
import type { AppActionControllers } from "./application-shell/App.js";
import type { StateReaderControllers } from "./state-reading/StateReaderControllers.js";
import { SubprocessManager } from "./daemon-subprocesses/SubprocessManager.js";

/**
 * Every service the terminal user interface consumes, and nothing more:
 * the read-side queries, the init-flow and add-goal action controllers,
 * the settings reader, the update checker, and the logger.
 */
export interface TuiDependencies {
  readonly stateReaderControllers: StateReaderControllers;
  readonly actionControllers: AppActionControllers;
  readonly settingsReader: Pick<ISettingsReader, "read" | "write">;
  readonly cliUpdateController: Pick<CliUpdateController, "check" | "upgrade">;
  readonly logger: ILogger;
}

export interface TuiComposition {
  readonly dependencies: TuiDependencies;
  dispose(): Promise<void>;
}

/**
 * Composes exactly the services the TUI consumes from LeafContainerBuilder
 * features, and records the resources it created for release on exit.
 */
export async function createTuiDependencies(): Promise<TuiComposition> {
  const builder = new LeafContainerBuilder()
    .withProjectInitFeature()
    .withAudienceFeature()
    .withValuePropositionFeature()
    .withAddGoalFeature()
    .withGetGoalsFeature()
    .withShowGoalFeature()
    .withGetSessionsFeature()
    .withGetComponentsFeature()
    .withGetDecisionsFeature()
    .withGetDependenciesFeature()
    .withGetGuidelinesFeature()
    .withGetInvariantsFeature()
    .withSearchFeature()
    .withProjectStatsFeature()
    .withProjectContextReaderFeature()
    .withSettingsReaderFeature()
    .withTelemetryClientFeature()
    .withCliUpdateFeature();
  try {
    const container = await builder.build();
    return {
      dependencies: {
        stateReaderControllers: {
          getProjectSummaryQueryHandler: new GetProjectSummaryQueryHandler(
            container.projectContextReader,
          ),
          getGoalsController: container.getGoalsController,
          showGoalController: container.showGoalController,
          getSessionsController: container.getSessionsController,
          getComponentsController: container.getComponentsController,
          getDecisionsController: container.getDecisionsController,
          getDependenciesController: container.getDependenciesController,
          getGuidelinesController: container.getGuidelinesController,
          getInvariantsController: container.getInvariantsController,
          projectStatsController: container.projectStatsController,
          searchController: container.searchController,
        },
        actionControllers: {
          planProjectInitController: container.planProjectInitController,
          initializeProjectController: container.initializeProjectController,
          addAudienceController: container.addAudienceController,
          addValuePropositionController:
            container.addValuePropositionController,
          addGoalController: container.addGoalController,
        },
        settingsReader: container.settingsReader,
        cliUpdateController: container.cliUpdateController,
        logger: container.logger,
      },
      dispose: () => builder.dispose(),
    };
  } catch (error) {
    await builder.dispose();
    throw error;
  }
}

/**
 * Composes and launches the TUI independently of the CLI startup pipeline.
 */
export class Initializer {
  constructor(
    private readonly createDependencies: () => Promise<TuiComposition> = createTuiDependencies,
  ) {}

  async launch(version: string): Promise<void> {
    const composition = await this.createDependencies();
    try {
      await new ApplicationLauncher(
        version,
        this.toLauncherDependencies(composition.dependencies),
        realpathSync(process.cwd()),
      ).launch();
    } finally {
      await composition.dispose();
    }
  }

  private toLauncherDependencies(
    dependencies: TuiDependencies,
  ): ApplicationLauncherDependencies {
    return {
      ...dependencies,
      subprocessManagerFactory: (logger) =>
        new SubprocessManager(new NodeWorkerDaemonProcessController(), logger),
    };
  }
}
