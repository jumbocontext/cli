import type { CliUpdateController } from "../../../application/cli-metadata/update/CliUpdateController.js";
import type { ILogger } from "../../../application/logging/ILogger.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import type { AppActionControllers } from "./App.js";
import type { StateReaderControllers } from "../state-reading/StateReaderControllers.js";
import type { ISubprocessManager } from "../daemon-subprocesses/ISubprocessManager.js";

/** Presentation capabilities for one launch; no container or runtime disposal authority. */
export interface ApplicationLauncherDependencies {
  readonly stateReaderControllers: StateReaderControllers;
  readonly actionControllers: AppActionControllers;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
  readonly cliUpdateController?: Pick<CliUpdateController, "check" | "upgrade">;
  readonly logger?: ILogger;
  readonly onProjectInitialized?: () => Promise<StateReaderControllers>;
  readonly subprocessManagerFactory?: (logger?: ILogger) => ISubprocessManager;
}
