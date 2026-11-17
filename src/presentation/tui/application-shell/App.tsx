import React, { useState, useEffect, useCallback } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header.js";
import { Footer } from "./Footer.js";
import { ScreenRouter } from "../navigation/ScreenRouter.js";
import { MegaMenu } from "../navigation/MegaMenu.js";
import type { MegaMenuScreenSelection } from "../navigation/MegaMenu.js";
import { SearchOverlay } from "../search/SearchOverlay.js";
import { InitFlow } from "../project-initialization/InitFlow.js";
import type { InitFlowActionControllers } from "../project-initialization/InitFlow.js";
import { GoalAuthoringFlow } from "../goals/GoalAuthoringFlow.js";
import type {
  GoalAuthoringSubmissionResult,
  GoalAuthoringValues,
} from "../goals/GoalAuthoringFlow.js";
import { GoalAuthoringRequestStatus } from "../goals/GoalAuthoringFlowConstants.js";
import { AddGoalRequestFactory } from "../goals/AddGoalRequestFactory.js";
import { DEFAULT_SCREEN_INDEX } from "../navigation/ScreenDefinitions.js";
import { ActionDispatcher } from "../action-dispatch/ActionDispatcher.js";
import type { RequestController } from "../action-dispatch/RequestController.js";
import { StateReaderProvider } from "../state-reading/StateReader.js";
import type { StateReaderControllers } from "../state-reading/StateReaderControllers.js";
import type { StateReaderOptions } from "../state-reading/StateReaderOptions.js";
import { useProjectContext } from "../state-reading/useProjectContext.js";
import { SubprocessManagerProvider } from "../daemon-subprocesses/SubprocessManagerProvider.js";
import { useSubprocessManager } from "../daemon-subprocesses/useSubprocessManager.js";
import type {
  ISubprocessManager,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";
import type { CliUpdateController } from "../../../application/cli-metadata/update/CliUpdateController.js";
import type { CliUpdateCheckResult } from "../../../application/cli-metadata/update/CliUpdateCheckResult.js";
import type { CliUpgradeResult } from "../../../application/cli-metadata/update/CliUpgradeResult.js";
import type { AddGoalRequest } from "../../../application/context/goals/add/AddGoalRequest.js";
import type { AddGoalResponse } from "../../../application/context/goals/add/AddGoalResponse.js";
import type { ProjectLifecycleState } from "../../../application/context/project/ProjectLifecycleState.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import type { ILogger } from "../../../application/logging/ILogger.js";
import type { GoalStatusType } from "../../../domain/goals/Constants.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import {
  TERMINAL_RESIZE_EVENT,
  FRAME_CHROME_ROWS,
  AppCopy,
  AppShortcut,
} from "./AppConstants.js";

const COCKPIT_FOOTER_SHORTCUTS = [
  AppShortcut.SEARCH,
  AppShortcut.TOGGLE_WORKER,
  AppShortcut.CREATE_GOAL,
] as const;
const DEFAULT_FOOTER_SHORTCUTS = [AppShortcut.SEARCH] as const;
const CLI_UPDATE_NOTIFICATION_ID = "cli-update-available";
const CLI_UPDATE_ACTION_CHAR = "u";
const CLI_UPDATE_PROGRESS_INTERVAL_MS = 160;
const CLI_UPDATE_PROGRESS_FRAMES = [
  "⠥",
  "⠏",
  "⠙",
  "⠁",
  "⠞",
  "⠊",
  "⠝",
  "⠛",
] as const;

function useTerminalDimensions(): { columns: number; rows: number } {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns ?? 80,
    rows: stdout.rows ?? 24,
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        columns: stdout.columns ?? 80,
        rows: stdout.rows ?? 24,
      });
    };
    stdout.on(TERMINAL_RESIZE_EVENT, onResize);
    return () => {
      stdout.off(TERMINAL_RESIZE_EVENT, onResize);
    };
  }, [stdout]);

  return dimensions;
}

interface AppProps {
  readonly version?: string;
  readonly directoryPath?: string;
  readonly stateReaderControllers?: StateReaderControllers;
  readonly stateReaderOptions?: StateReaderOptions;
  readonly actionControllers?: AppActionControllers;
  readonly onProjectInitialized?: () => Promise<StateReaderControllers>;
  readonly subprocessManager?: ISubprocessManager;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
  readonly cliUpdateController?: Pick<CliUpdateController, "check" | "upgrade">;
  readonly logger?: ILogger;
  readonly launchAnimationEnabled?: boolean;
}

export interface AppActionControllers extends InitFlowActionControllers {
  readonly addGoalController?: RequestController<
    AddGoalRequest,
    AddGoalResponse
  >;
}

export function App({
  version = "",
  directoryPath = "",
  stateReaderControllers,
  stateReaderOptions,
  actionControllers,
  onProjectInitialized,
  subprocessManager,
  settingsReader,
  cliUpdateController,
  logger,
  launchAnimationEnabled = true,
}: AppProps = {}): React.ReactElement {
  const [activeStateReaderControllers, setActiveStateReaderControllers] =
    useState(stateReaderControllers);

  const handleProjectInitialized = useCallback(async (): Promise<boolean> => {
    if (onProjectInitialized === undefined) {
      return false;
    }

    setActiveStateReaderControllers(await onProjectInitialized());
    return true;
  }, [onProjectInitialized]);

  const activeSubprocessManager = subprocessManager;

  return (
    <StateReaderProvider
      controllers={activeStateReaderControllers}
      options={stateReaderOptions}
    >
      {activeSubprocessManager === undefined ? (
        <AppFrame
          version={version}
          directoryPath={directoryPath}
          actionControllers={actionControllers}
          onProjectInitialized={handleProjectInitialized}
          subprocessManagerEnabled={false}
          settingsReader={settingsReader}
          cliUpdateController={cliUpdateController}
          logger={logger}
          launchAnimationEnabled={launchAnimationEnabled}
        />
      ) : (
        <SubprocessManagerProvider manager={activeSubprocessManager}>
          <AppFrame
            version={version}
            directoryPath={directoryPath}
            actionControllers={actionControllers}
            onProjectInitialized={handleProjectInitialized}
            subprocessManagerEnabled={true}
            settingsReader={settingsReader}
            cliUpdateController={cliUpdateController}
            logger={logger}
            launchAnimationEnabled={launchAnimationEnabled}
          />
        </SubprocessManagerProvider>
      )}
    </StateReaderProvider>
  );
}

interface AppFrameProps {
  readonly version: string;
  readonly directoryPath: string;
  readonly actionControllers?: AppActionControllers;
  readonly onProjectInitialized: () => Promise<boolean>;
  readonly subprocessManagerEnabled: boolean;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
  readonly cliUpdateController?: Pick<CliUpdateController, "check" | "upgrade">;
  readonly logger?: ILogger;
  readonly launchAnimationEnabled: boolean;
}

function AppFrame({
  version,
  directoryPath,
  actionControllers,
  onProjectInitialized,
  subprocessManagerEnabled,
  settingsReader,
  cliUpdateController,
  logger,
  launchAnimationEnabled,
}: AppFrameProps): React.ReactElement {
  const { exit } = useApp();
  const subprocessManager = useSubprocessManager();
  const { columns, rows } = useTerminalDimensions();
  const projectContext = useProjectContext();
  const [activeScreenIndex, setActiveScreenIndex] =
    useState(DEFAULT_SCREEN_INDEX);
  const [initFlowOpen, setInitFlowOpen] = useState(false);
  const [goalAuthoringOpen, setGoalAuthoringOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [goalStatusFilter, setGoalStatusFilter] = useState<
    readonly GoalStatusType[] | undefined
  >(undefined);
  const [lifecycleRouteOverride, setLifecycleRouteOverride] =
    useState<ProjectLifecycleState | null>(null);
  const [unprimedSkipped, setUnprimedSkipped] = useState(false);
  const [bannerAnimationComplete, setBannerAnimationComplete] = useState(
    !launchAnimationEnabled,
  );
  const [billboardAnimationComplete, setBillboardAnimationComplete] = useState(
    !launchAnimationEnabled,
  );
  const [daemonStatuses, setDaemonStatuses] = useState<
    readonly SubprocessSnapshot[]
  >(subprocessManager.getAllStatuses());
  const [cliUpdateCheck, setCliUpdateCheck] =
    useState<CliUpdateCheckResult | null>(null);
  const [cliUpgradeResult, setCliUpgradeResult] =
    useState<CliUpgradeResult | null>(null);
  const [cliUpgradeWorking, setCliUpgradeWorking] = useState(false);
  const [cliUpgradeProgressFrame, setCliUpgradeProgressFrame] = useState(0);
  const projectLifecycleState =
    projectContext.data?.lifecycleState ?? ProjectLifecycle.UNINITIALIZED;
  const routedProjectLifecycleState =
    lifecycleRouteOverride ??
    (projectLifecycleState === ProjectLifecycle.UNPRIMED && unprimedSkipped
      ? ProjectLifecycle.PRIMED_EMPTY
      : projectLifecycleState);
  const initShortcutEnabled =
    !projectContext.loading &&
    projectLifecycleState === ProjectLifecycle.UNINITIALIZED;
  const shellOverlaysClosed =
    !initFlowOpen && !goalAuthoringOpen && !searchOpen && !megaMenuOpen;
  const footerShortcutsEnabled =
    shellOverlaysClosed && !screenModalOpen && !initShortcutEnabled;
  const contentShortcutsEnabled =
    shellOverlaysClosed && !screenModalOpen && !notificationDrawerOpen;
  const cockpitLaunchpadVisible =
    !initFlowOpen &&
    !goalAuthoringOpen &&
    !searchOpen &&
    !megaMenuOpen &&
    activeScreenIndex === DEFAULT_SCREEN_INDEX &&
    routedProjectLifecycleState === ProjectLifecycle.PRIMED;
  const goalAuthoringShortcutEnabled =
    !projectContext.loading &&
    activeScreenIndex === DEFAULT_SCREEN_INDEX &&
    (routedProjectLifecycleState === ProjectLifecycle.PRIMED_EMPTY ||
      cockpitLaunchpadVisible);

  useEffect(() => {
    if (projectLifecycleState !== ProjectLifecycle.UNPRIMED) {
      setUnprimedSkipped(false);
    }
  }, [projectLifecycleState]);

  useEffect(() => {
    if (!launchAnimationEnabled) {
      setBannerAnimationComplete(true);
      setBillboardAnimationComplete(true);
    }
  }, [launchAnimationEnabled]);

  useEffect(() => {
    if (
      lifecycleRouteOverride !== null &&
      projectLifecycleState === lifecycleRouteOverride
    ) {
      setLifecycleRouteOverride(null);
    }
  }, [lifecycleRouteOverride, projectLifecycleState]);

  useEffect(() => {
    if (!subprocessManagerEnabled) {
      return;
    }

    const timer = setInterval(() => {
      setDaemonStatuses(subprocessManager.getAllStatuses());
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [subprocessManager, subprocessManagerEnabled]);

  useEffect(() => {
    if (cliUpdateController === undefined || version.trim().length === 0) {
      return;
    }

    let cancelled = false;
    void cliUpdateController
      .check(version)
      .then((result) => {
        if (!cancelled) {
          setCliUpdateCheck(result);
          setCliUpgradeResult(null);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [cliUpdateController, version]);

  useEffect(() => {
    if (!cliUpgradeWorking) {
      setCliUpgradeProgressFrame(0);
      return;
    }

    const timer = setInterval(() => {
      setCliUpgradeProgressFrame(
        (previous) => (previous + 1) % CLI_UPDATE_PROGRESS_FRAMES.length,
      );
    }, CLI_UPDATE_PROGRESS_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [cliUpgradeWorking]);

  useInput((input) => {
    if (!contentShortcutsEnabled) {
      return;
    }
    if (input === "q") {
      exit();
    }
    if (input === AppShortcut.SEARCH.char) {
      setSearchOpen(true);
    }
    if (input === "m" || input === "M") {
      setMegaMenuOpen(true);
    }
    if (initShortcutEnabled && (input === "i" || input === "I")) {
      setInitFlowOpen(true);
    }
    if (goalAuthoringShortcutEnabled && (input === "g" || input === "G")) {
      setGoalAuthoringOpen(true);
    }
    if (
      activeScreenIndex === DEFAULT_SCREEN_INDEX &&
      projectLifecycleState === ProjectLifecycle.UNPRIMED &&
      (input === "s" || input === "S")
    ) {
      setUnprimedSkipped(true);
    }
  });

  const completeStateChangingOverlay = useCallback(
    async (
      closeOverlay: () => void,
      options: {
        readonly lifecycleRouteOverride?: ProjectLifecycleState;
        readonly reinstallStateReaders?: boolean;
      } = {},
    ) => {
      if (options.lifecycleRouteOverride !== undefined) {
        setLifecycleRouteOverride(options.lifecycleRouteOverride);
        setActiveScreenIndex(DEFAULT_SCREEN_INDEX);
      }

      if (options.reinstallStateReaders) {
        const installedStateReaders = await onProjectInitialized();
        if (!installedStateReaders) {
          await projectContext.refresh();
        }
      } else {
        await projectContext.refresh();
      }

      closeOverlay();
    },
    [onProjectInitialized, projectContext],
  );

  const handleInitComplete = useCallback(
    async (_values: Record<string, string>) => {
      await completeStateChangingOverlay(() => setInitFlowOpen(false), {
        reinstallStateReaders: true,
      });
    },
    [completeStateChangingOverlay],
  );

  const handleInitCancel = useCallback(() => {
    setInitFlowOpen(false);
  }, []);

  const handleGoalAuthoringComplete = useCallback(
    async (
      values: GoalAuthoringValues,
    ): Promise<GoalAuthoringSubmissionResult> => {
      const addGoalController = actionControllers?.addGoalController;
      if (addGoalController === undefined) {
        return {
          status: GoalAuthoringRequestStatus.FAILURE,
          error: AppCopy.goalAuthoringUnavailable,
        };
      }

      const result = await ActionDispatcher.dispatch(
        addGoalController,
        AddGoalRequestFactory.create(values),
      );

      if (!result.ok) {
        return {
          status: GoalAuthoringRequestStatus.FAILURE,
          error: result.error.message,
        };
      }

      return {
        status: GoalAuthoringRequestStatus.SUCCESS,
        goalId: result.response.goalId,
      };
    },
    [actionControllers],
  );

  const handleGoalAuthoringAcknowledged = useCallback(
    async (_goalId: string) => {
      await completeStateChangingOverlay(() => setGoalAuthoringOpen(false), {
        lifecycleRouteOverride: ProjectLifecycle.PRIMED,
      });
    },
    [completeStateChangingOverlay],
  );

  const handleGoalAuthoringCancel = useCallback(() => {
    setGoalAuthoringOpen(false);
  }, []);

  const handleNotificationAction = useCallback(
    async (id: string) => {
      if (
        id !== CLI_UPDATE_NOTIFICATION_ID ||
        cliUpdateController === undefined ||
        cliUpdateCheck?.status !== "update-available" ||
        !cliUpdateCheck.feasibility.feasible ||
        cliUpgradeWorking
      ) {
        return;
      }

      setCliUpgradeWorking(true);
      const result = await cliUpdateController.upgrade(
        cliUpdateCheck.latestVersion,
      );
      setCliUpgradeResult(result);
      setCliUpgradeWorking(false);
    },
    [cliUpdateCheck, cliUpdateController, cliUpgradeWorking],
  );

  const handleBannerAnimationComplete = useCallback(() => {
    setBannerAnimationComplete(true);
  }, []);

  const handleBillboardAnimationComplete = useCallback(() => {
    setBillboardAnimationComplete(true);
  }, []);

  const handleMegaMenuScreenSelect = useCallback(
    (selection: MegaMenuScreenSelection) => {
      setActiveScreenIndex(selection.screenIndex);
      setGoalStatusFilter(selection.goalStatusFilter);
      setMegaMenuOpen(false);
    },
    [],
  );

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box flexShrink={0}>
        <Header
          projectName={
            projectContext.data?.name ?? AppCopy.placeholderProjectName
          }
          directoryPath={directoryPath}
          version={version}
          terminalWidth={columns}
        />
      </Box>
      <Box flexGrow={1} flexDirection="column" position="relative">
        <Box flexGrow={1} flexDirection="column">
          <ScreenRouter
            activeScreenIndex={activeScreenIndex}
            projectLifecycleState={routedProjectLifecycleState}
            shortcutsEnabled={contentShortcutsEnabled}
            terminalWidth={columns}
            terminalHeight={Math.max(1, rows - FRAME_CHROME_ROWS)}
            goalStatusFilter={goalStatusFilter}
            addGoalController={actionControllers?.addGoalController}
            onModalOpenChange={setScreenModalOpen}
            settingsReader={settingsReader}
            launchAnimationEnabled={launchAnimationEnabled}
            bannerAnimationComplete={bannerAnimationComplete}
            billboardAnimationComplete={billboardAnimationComplete}
            onBannerAnimationComplete={handleBannerAnimationComplete}
            onBillboardAnimationComplete={handleBillboardAnimationComplete}
          />
        </Box>
        {megaMenuOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <MegaMenu
              activeScreenIndex={activeScreenIndex}
              onScreenSelect={handleMegaMenuScreenSelect}
              onClose={() => setMegaMenuOpen(false)}
              terminalWidth={columns}
            />
          </Box>
        )}
        {initFlowOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <InitFlow
              actionControllers={actionControllers}
              onComplete={handleInitComplete}
              onCancel={handleInitCancel}
              logger={logger}
            />
          </Box>
        )}
        {goalAuthoringOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <GoalAuthoringFlow
              onComplete={handleGoalAuthoringComplete}
              onSuccessAcknowledged={handleGoalAuthoringAcknowledged}
              onCancel={handleGoalAuthoringCancel}
            />
          </Box>
        )}
        {searchOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <SearchOverlay
              onClose={() => setSearchOpen(false)}
              terminalWidth={columns}
              terminalHeight={Math.max(1, rows - FRAME_CHROME_ROWS)}
            />
          </Box>
        )}
      </Box>
      <Box flexShrink={0}>
        <Footer
          terminalWidth={columns}
          shortcutsEnabled={footerShortcutsEnabled}
          contextualShortcuts={
            searchOpen
              ? []
              : cockpitLaunchpadVisible
                ? COCKPIT_FOOTER_SHORTCUTS
                : DEFAULT_FOOTER_SHORTCUTS
          }
          notifications={buildNotifications(
            daemonStatuses,
            cliUpdateCheck,
            cliUpgradeResult,
            cliUpgradeWorking,
            cliUpgradeProgressFrame,
          )}
          onNotificationAction={handleNotificationAction}
          onNotificationDrawerOpenChange={setNotificationDrawerOpen}
        />
      </Box>
    </Box>
  );
}

function buildDaemonFailureNotifications(
  statuses: readonly SubprocessSnapshot[],
): readonly NotificationDrawerNotification[] {
  return statuses
    .filter((status) => status.status === SubprocessStatus.FAILED)
    .map((status) => ({
      id: `daemon-${status.name}-failed`,
      title: `${status.name.toUpperCase()} daemon failed`,
      body:
        status.stderr[status.stderr.length - 1] ?? AppCopy.daemonFailureBody,
      unread: true,
    }));
}

function buildNotifications(
  daemonStatuses: readonly SubprocessSnapshot[],
  cliUpdateCheck: CliUpdateCheckResult | null,
  cliUpgradeResult: CliUpgradeResult | null,
  cliUpgradeWorking: boolean,
  cliUpgradeProgressFrame: number,
): readonly NotificationDrawerNotification[] {
  const cliUpdateNotification = buildCliUpdateNotification(
    cliUpdateCheck,
    cliUpgradeResult,
    cliUpgradeWorking,
    cliUpgradeProgressFrame,
  );

  return [
    ...(cliUpdateNotification === null ? [] : [cliUpdateNotification]),
    ...buildDaemonFailureNotifications(daemonStatuses),
  ];
}

function buildCliUpdateNotification(
  cliUpdateCheck: CliUpdateCheckResult | null,
  cliUpgradeResult: CliUpgradeResult | null,
  cliUpgradeWorking: boolean,
  cliUpgradeProgressFrame: number,
): NotificationDrawerNotification | null {
  if (cliUpdateCheck?.status !== "update-available") {
    return null;
  }

  const versionSummary = `Local ${cliUpdateCheck.localVersion}, latest ${cliUpdateCheck.latestVersion}.`;

  if (cliUpgradeWorking) {
    const progressGlyph =
      CLI_UPDATE_PROGRESS_FRAMES[
        cliUpgradeProgressFrame % CLI_UPDATE_PROGRESS_FRAMES.length
      ];
    return {
      id: CLI_UPDATE_NOTIFICATION_ID,
      title: `Jumbo update in progress ${progressGlyph}`,
      body: `${versionSummary} Running npm upgrade.`,
      unread: true,
    };
  }

  if (cliUpgradeResult !== null) {
    return {
      id: CLI_UPDATE_NOTIFICATION_ID,
      title: cliUpgradeResult.ok
        ? "Jumbo update completed"
        : "Jumbo update needs manual action",
      body: cliUpgradeResult.ok
        ? `${versionSummary} ${cliUpgradeResult.message}`
        : `${versionSummary} ${cliUpgradeResult.guidance}`,
      unread: !cliUpgradeResult.ok,
    };
  }

  if (cliUpdateCheck.feasibility.feasible) {
    return {
      id: CLI_UPDATE_NOTIFICATION_ID,
      title: "New version of Jumbo available",
      body: `Upgrade to ${cliUpdateCheck.latestVersion} or dismiss the notification.`,
      unread: true,
      action: {
        char: CLI_UPDATE_ACTION_CHAR,
        label: "upgrade",
      },
    };
  }

  return {
    id: CLI_UPDATE_NOTIFICATION_ID,
    title: "New version of Jumbo available.",
    body: `Upgrade to ${cliUpdateCheck.latestVersion}: ${cliUpdateCheck.feasibility.guidance}`,
    unread: true,
  };
}
