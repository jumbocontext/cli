import React from "react";
import { render } from "ink";
import type { ILogger } from "../../../application/logging/ILogger.js";
import { App } from "./App.js";
import type { ApplicationLauncherDependencies } from "./ApplicationLauncherDependencies.js";
import type { ISubprocessManager } from "../daemon-subprocesses/ISubprocessManager.js";

const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
const SIGNAL_EXIT_CODES: Record<(typeof SHUTDOWN_SIGNALS)[number], number> = {
  SIGINT: 130,
  SIGTERM: 143,
  SIGHUP: 129,
};

type ShutdownReason =
  | "ink-exit"
  | "launch-failure"
  | "beforeExit"
  | `signal:${(typeof SHUTDOWN_SIGNALS)[number]}`;

export class ApplicationLauncher {
  constructor(
    private readonly version: string,
    private readonly dependencies: ApplicationLauncherDependencies,
    private readonly directoryPath: string = process.cwd(),
  ) {}

  async launch(): Promise<void> {
    const subprocessManager = this.dependencies.subprocessManagerFactory?.(
      this.dependencies.logger,
    );
    const shutdown = new LauncherSubprocessShutdown(
      subprocessManager,
      this.dependencies.logger,
    );
    let pendingError: unknown;

    shutdown.install();

    try {
      try {
        const application = render(
          <App
            version={this.version}
            directoryPath={this.directoryPath}
            stateReaderControllers={this.dependencies.stateReaderControllers}
            actionControllers={this.dependencies.actionControllers}
            onProjectInitialized={this.dependencies.onProjectInitialized}
            subprocessManager={subprocessManager}
            settingsReader={this.dependencies.settingsReader}
            cliUpdateController={this.dependencies.cliUpdateController}
            logger={this.dependencies.logger}
          />,
        );

        try {
          await application.waitUntilExit();
        } catch (error) {
          pendingError = error;
        } finally {
          pendingError = this.combineShutdownError(
            pendingError,
            await shutdown.cleanup("ink-exit"),
          );
        }
      } catch (error) {
        pendingError = this.combineShutdownError(
          pendingError === undefined ? error : pendingError,
          await shutdown.cleanup("launch-failure"),
        );
      }
    } finally {
      shutdown.uninstall();
    }

    if (pendingError !== undefined) {
      throw pendingError;
    }
  }

  private combineShutdownError(
    primaryError: unknown,
    cleanupError: unknown,
  ): unknown {
    if (cleanupError === undefined) {
      return primaryError;
    }

    if (primaryError === undefined) {
      return cleanupError;
    }

    const combinedError = new Error(
      "Application launcher failed during TUI exit and daemon subprocess cleanup.",
    ) as Error & { readonly errors: readonly unknown[] };
    Object.defineProperty(combinedError, "errors", {
      value: [primaryError, cleanupError],
      enumerable: true,
    });

    return combinedError;
  }
}

class LauncherSubprocessShutdown {
  private cleanupPromise: Promise<unknown | undefined> | undefined;
  private installed = false;

  private readonly signalHandlers = new Map<
    (typeof SHUTDOWN_SIGNALS)[number],
    () => void
  >();

  private readonly beforeExitHandler = (): void => {
    void this.cleanup("beforeExit").finally(() => {
      this.uninstall();
    });
  };

  constructor(
    private readonly subprocessManager: ISubprocessManager | undefined,
    private readonly logger: ILogger | undefined,
  ) {}

  install(): void {
    if (this.subprocessManager === undefined || this.installed) {
      return;
    }

    process.on("beforeExit", this.beforeExitHandler);

    for (const signal of SHUTDOWN_SIGNALS) {
      const handler = (): void => {
        void this.cleanup(`signal:${signal}`).finally(() => {
          this.uninstall();
          process.exit(SIGNAL_EXIT_CODES[signal]);
        });
      };
      this.signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }

    this.installed = true;
  }

  uninstall(): void {
    if (!this.installed) {
      return;
    }

    process.off("beforeExit", this.beforeExitHandler);

    for (const [signal, handler] of this.signalHandlers.entries()) {
      process.off(signal, handler);
    }

    this.signalHandlers.clear();
    this.installed = false;
  }

  async cleanup(reason: ShutdownReason): Promise<unknown | undefined> {
    if (this.subprocessManager === undefined) {
      return undefined;
    }

    this.cleanupPromise ??= this.terminateAll(reason);

    return this.cleanupPromise;
  }

  private async terminateAll(reason: ShutdownReason): Promise<unknown | undefined> {
    this.logger?.info("TUI daemon subprocess shutdown requested", { reason });

    try {
      await this.subprocessManager?.terminateAll();
      this.logger?.info("TUI daemon subprocess shutdown completed", { reason });
      return undefined;
    } catch (error) {
      this.logger?.error(
        "TUI daemon subprocess shutdown failed",
        error,
        { reason },
      );
      return error;
    }
  }
}
