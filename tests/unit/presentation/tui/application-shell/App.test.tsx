import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import type {
  ISubprocessManager,
  DaemonName,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";
import type { AddGoalRequest } from "../../../../../src/application/context/goals/add/AddGoalRequest.js";
import type { Settings } from "../../../../../src/application/settings/Settings.js";
import {
  GoalAuthoringRequestStatus,
  GoalAuthoringResultCopy,
} from "../../../../../src/presentation/tui/goals/GoalAuthoringFlowConstants.js";

interface HeaderProps {
  readonly projectName: string;
  readonly directoryPath: string;
  readonly version: string;
  readonly terminalWidth: number;
}

const mockHeader = jest.fn<(props: HeaderProps) => React.ReactElement>(
  (props) => (
    <Box>
      <Text>{props.projectName}</Text>
      <Text>{props.directoryPath}</Text>
      <Text>{props.version}</Text>
    </Box>
  ),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/application-shell/Header.js",
  () => ({
    Header: mockHeader,
  }),
);

const { App: ProductionApp } =
  await import("../../../../../src/presentation/tui/application-shell/App.js");

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForFrame = async (
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
) => {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    await tick();
    const frame = lastFrame() ?? "";
    if (predicate(frame)) {
      return frame;
    }
  }
  throw new Error(`Timed out waiting for frame:\n${lastFrame() ?? ""}`);
};

const navigateFromCockpitToGoals = async (
  stdin: { write(input: string): void },
  lastFrame: () => string | undefined,
) => {
  stdin.write("m");
  await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));
  stdin.write("\u001B[B");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("GOALS//"));
};

const navigateFromGoalsToCockpit = async (
  stdin: { write(input: string): void },
  lastFrame: () => string | undefined,
) => {
  stdin.write("m");
  await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));
  stdin.write("\u001B[A");
  await tick();
  stdin.write("\r");
  await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));
};

function App(
  props: React.ComponentProps<typeof ProductionApp>,
): React.ReactElement {
  return <ProductionApp launchAnimationEnabled={false} {...props} />;
}

describe("App", () => {
  beforeEach(() => {
    mockHeader.mockClear();
  });

  const projectSummaryController = (
    lifecycleState: "uninitialized" | "unprimed" | "primed-empty" | "primed",
  ) => ({
    execute: async () => ({
      name: "Test Project",
      purpose: null,
      lifecycleState,
    }),
  });
  const failedDaemonSnapshot: SubprocessSnapshot = {
    name: "reviewer",
    status: "failed",
    config: {
      agentId: "reviewer-agent",
      pollIntervalMs: 100,
      maxRetries: 1,
    },
    stdout: [],
    stderr: ["reviewer failed"],
    events: [],
    exitCode: 1,
    exitSignal: null,
  };
  const subprocessManagerWithFailedDaemon: ISubprocessManager = {
    spawn: async () => failedDaemonSnapshot,
    terminate: async () => failedDaemonSnapshot,
    terminateAll: async () => {},
    getStatus: (_name: DaemonName) => failedDaemonSnapshot,
    getAllStatuses: () => [failedDaemonSnapshot],
  };
  const stoppedDaemonSnapshot: SubprocessSnapshot = {
    name: "refiner",
    status: "stopped",
    config: {
      agentId: "refiner-agent",
      pollIntervalMs: 100,
      maxRetries: 1,
    },
    stdout: [],
    stderr: [],
    events: [],
  };
  const subprocessManagerWithTerminateAll = (
    terminateAll: jest.MockedFunction<() => Promise<void>>,
  ): ISubprocessManager => ({
    spawn: jest.fn(async () => stoppedDaemonSnapshot),
    terminate: jest.fn(async () => stoppedDaemonSnapshot),
    terminateAll,
    getStatus: jest.fn((_name: DaemonName) => stoppedDaemonSnapshot),
    getAllStatuses: jest.fn(() => [stoppedDaemonSnapshot]),
  });
  const hiddenLaunchpadWelcomeSettingsReader = () => ({
    read: async (): Promise<Settings> => ({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: {
        enabled: true,
        anonymousId: null,
        consentGiven: false,
      },
      tui: { showLaunchpadWelcome: false },
    }),
    write: async (_settings: Settings): Promise<void> => {},
  });

  it("renders a non-empty frame on mount", () => {
    const { lastFrame, unmount } = render(
      <App settingsReader={hiddenLaunchpadWelcomeSettingsReader()} />,
    );
    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
    unmount();
  });

  it("passes the directory path to Header without deriving it in Header", () => {
    const { unmount } = render(
      <App
        directoryPath={"C:\\projects\\jumbo\\cli"}
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
      />,
    );
    const headerProps = mockHeader.mock.calls[0][0];

    expect(headerProps).toMatchObject({
      projectName: "Jumbo",
      directoryPath: "C:\\projects\\jumbo\\cli",
      version: "",
      terminalWidth: expect.any(Number),
    });
    unmount();
  });

  it("opens the MegaMenu from the lowercase global shortcut", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App settingsReader={hiddenLaunchpadWelcomeSettingsReader()} />,
    );

    stdin.write("m");
    await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));

    expect(lastFrame()).toContain("Navigate");
    expect(lastFrame()).toContain("[Cockpit]");
    unmount();
  });

  it("opens the MegaMenu from the uppercase global shortcut", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App settingsReader={hiddenLaunchpadWelcomeSettingsReader()} />,
    );

    stdin.write("M");
    await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));

    expect(lastFrame()).toContain("Navigate");
    unmount();
  });

  it("opens the init flow from the global shortcut when the project is uninitialized", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("uninitialized"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    expect(lastFrame()).not.toContain("Initialize Project");

    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Initialize Project"),
    );

    expect(lastFrame()).toContain("Initialize Project");
    unmount();
  });

  it("does not open the init flow from the global shortcut after initialization", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    expect(lastFrame()).not.toContain("init");

    stdin.write("i");
    await tick();

    expect(lastFrame()).not.toContain("Initialize Project");
    unmount();
  });

  it("shows the cockpit launchpad footer badges only on the primed cockpit launchpad", async () => {
    const { lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));

    expect(lastFrame()).toContain(" tab ");
    expect(lastFrame()).toContain(" g ");
    unmount();
  }, 10000);

  it("does not show the create-goal footer badge outside the primed cockpit launchpad", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    expect(lastFrame()).not.toContain("create goal");

    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));
    expect(lastFrame()).not.toContain("create goal");
    unmount();
  }, 10000);

  it("skips the unprimed cockpit screen for the current TUI session", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("unprimed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    stdin.write("s");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project memory is stored."),
    );

    expect(lastFrame()).toContain("Ready to create your first goal.");
    expect(lastFrame()).not.toContain("This looks like an existing project.");
    unmount();
  }, 10000);

  it("opens goal authoring from the primed-empty cockpit shortcut", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );

    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).toContain("Objective");
    expect(lastFrame()).not.toContain("create goal");
    unmount();
  }, 10000);

  it("opens goal authoring from the primed cockpit shortcut", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));

    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).toContain("Objective");
    unmount();
  }, 10000);

  it("keeps success criterion text while daemon polling re-renders the primed cockpit", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        subprocessManager={subprocessManagerWithFailedDaemon}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("Prototype Cockpit goal authoring");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Open goal authoring from Cockpit");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Success criterion"),
    );

    stdin.write("Criterion survives daemon polling");
    await tick();
    expect(lastFrame()).toContain("Criterion survives daemon polling");

    await wait(650);
    expect(lastFrame()).toContain("Criterion survives daemon polling");
    unmount();
  }, 10000);

  it("lets q exit flow through Ink without terminating daemon subprocesses in App", async () => {
    const terminateAll = jest.fn<() => Promise<void>>().mockResolvedValue();
    const { stdin, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        subprocessManager={subprocessManagerWithTerminateAll(terminateAll)}
      />,
    );

    stdin.write("q");
    await tick();

    expect(terminateAll).not.toHaveBeenCalled();
    unmount();
  });

  it("does not fire-and-forget daemon cleanup during App unmount", async () => {
    const terminateAll = jest.fn<() => Promise<void>>().mockResolvedValue();
    const { unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        subprocessManager={subprocessManagerWithTerminateAll(terminateAll)}
      />,
    );

    unmount();
    await tick();

    expect(terminateAll).not.toHaveBeenCalled();
  });

  it("preserves one running daemon across navigation and stops it exactly once on request", async () => {
    let refinerSnapshot: SubprocessSnapshot = {
      name: "refiner",
      status: "running",
      pid: 4101,
      config: stoppedDaemonSnapshot.config,
      stdout: [],
      stderr: [],
      events: [
        {
          daemon: "refiner",
          status: "working",
          category: "activity",
          goalId: "goal_single_navigation",
          phase: "agent",
          elapsedMs: 1_000,
          timestampMs: 1_000,
          message: "single navigation activity",
        },
      ],
    };
    const terminate = jest.fn(async (name: DaemonName) => {
      refinerSnapshot = { ...refinerSnapshot, name, status: "stopped" };
      return refinerSnapshot;
    });
    const terminateAll = jest.fn(async () => {});
    const manager: ISubprocessManager = {
      spawn: jest.fn(async () => refinerSnapshot),
      terminate,
      terminateAll,
      getStatus: jest.fn(() => refinerSnapshot),
      getAllStatuses: jest.fn(() => [refinerSnapshot]),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        subprocessManager={manager}
      />,
    );

    try {
      await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));
      await navigateFromCockpitToGoals(stdin, lastFrame);

      refinerSnapshot = {
        ...refinerSnapshot,
        events: [
          ...refinerSnapshot.events,
          {
            daemon: "refiner",
            status: "working",
            category: "heartbeat",
            goalId: "goal_single_navigation",
            elapsedMs: 6_000,
            timestampMs: 6_000,
            message: "still working",
          },
        ],
      };

      await navigateFromGoalsToCockpit(stdin, lastFrame);
      await waitForFrame(
        lastFrame,
        (frame) =>
          frame.includes("single navigation activity") && frame.includes("6s"),
      );

      expect(manager.spawn).not.toHaveBeenCalled();
      expect(terminate).not.toHaveBeenCalled();
      expect(terminateAll).not.toHaveBeenCalled();
      expect(manager.getStatus("refiner").pid).toBe(4101);

      stdin.write("s");
      await waitForFrame(lastFrame, () => terminate.mock.calls.length === 1);
      await tick();

      expect(terminate).toHaveBeenCalledTimes(1);
      expect(terminate).toHaveBeenCalledWith("refiner");
      expect(terminateAll).not.toHaveBeenCalled();
    } finally {
      unmount();
    }
  }, 10000);

  it("preserves multiple independently updating daemons across navigation", async () => {
    const snapshots = new Map<DaemonName, SubprocessSnapshot>([
      [
        "refiner",
        {
          name: "refiner",
          status: "running",
          pid: 5101,
          config: stoppedDaemonSnapshot.config,
          stdout: [],
          stderr: [],
          events: [
            {
              daemon: "refiner",
              status: "working",
              category: "activity",
              goalId: "goal_refiner",
              timestampMs: 7_000,
              message: "refiner resumed",
            },
          ],
        },
      ],
      [
        "reviewer",
        {
          name: "reviewer",
          status: "running",
          pid: 5102,
          config: stoppedDaemonSnapshot.config,
          stdout: [],
          stderr: [],
          events: [
            {
              daemon: "reviewer",
              status: "working",
              category: "activity",
              goalId: "goal_reviewer",
              timestampMs: 8_000,
              message: "reviewer resumed",
            },
          ],
        },
      ],
      [
        "codifier",
        {
          name: "codifier",
          status: "running",
          pid: 5103,
          config: stoppedDaemonSnapshot.config,
          stdout: [],
          stderr: [],
          events: [
            {
              daemon: "codifier",
              status: "working",
              category: "activity",
              goalId: "goal_codifier",
              timestampMs: 9_000,
              message: "codifier resumed",
            },
          ],
        },
      ],
    ]);
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name) => snapshots.get(name)!),
      terminate: jest.fn(async (name) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => [...snapshots.values()]),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        subprocessManager={manager}
      />,
    );

    try {
      await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));
      await navigateFromCockpitToGoals(stdin, lastFrame);

      for (const [name, snapshot] of snapshots) {
        snapshots.set(name, {
          ...snapshot,
          events: snapshot.events.map((event) => ({
            ...event,
            elapsedMs:
              name === "refiner" ? 7_000 : name === "reviewer" ? 8_000 : 9_000,
          })),
        });
      }

      await navigateFromGoalsToCockpit(stdin, lastFrame);
      const frame = await waitForFrame(
        lastFrame,
        (currentFrame) =>
          currentFrame.includes("refiner resumed") &&
          currentFrame.includes("reviewer resumed") &&
          currentFrame.includes("codifier resumed"),
      );

      expect(frame).toContain("7s");
      expect(frame).toContain("8s");
      expect(frame).toContain("9s");
      expect(manager.getStatus("refiner").pid).toBe(5101);
      expect(manager.getStatus("reviewer").pid).toBe(5102);
      expect(manager.getStatus("codifier").pid).toBe(5103);
      expect(manager.spawn).not.toHaveBeenCalled();
      expect(manager.terminate).not.toHaveBeenCalled();
      expect(manager.terminateAll).not.toHaveBeenCalled();
    } finally {
      unmount();
    }
  }, 10000);

  it("does not open goal authoring from uninitialized cockpit state", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("uninitialized"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));

    stdin.write("g");
    await tick();

    expect(lastFrame()).not.toContain("Author Goal");
    unmount();
  }, 10000);

  it("suppresses surrounding shortcuts while goal authoring is open", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
        subprocessManager={subprocessManagerWithFailedDaemon}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("G");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("m");
    await tick();
    stdin.write("i");
    await tick();

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).not.toContain("Navigate");
    expect(lastFrame()).not.toContain("Notifications");
    unmount();
  }, 10000);

  it("does not open the MegaMenu while search owns text input", async () => {
    const searchController = {
      handle: jest.fn(async () => ({ hits: [], groups: [] })),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          searchController,
        }}
      />,
    );

    stdin.write("/");
    await waitForFrame(lastFrame, (frame) => frame.includes("search memory"));

    stdin.write("m");
    await waitForFrame(
      lastFrame,
      () => searchController.handle.mock.calls.length > 0,
    );

    expect(searchController.handle).toHaveBeenCalledWith({
      criteria: {
        query: "m",
        limit: expect.any(Number),
      },
    });
    expect(lastFrame()).not.toContain("Navigate");
    unmount();
  }, 10000);

  it("does not open the MegaMenu while the notification drawer owns input", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    stdin.write("i");
    await waitForFrame(lastFrame, (frame) => frame.includes("Notifications"));

    stdin.write("M");
    await tick();

    expect(lastFrame()).toContain("Notifications");
    expect(lastFrame()).not.toContain("Navigate");
    unmount();
  }, 10000);

  it("shows an actionable CLI update notification and runs the upgrade branch", async () => {
    let completeUpgrade: (() => void) | undefined;
    const upgradeReleased = new Promise<void>((resolve) => {
      completeUpgrade = resolve;
    });
    const upgrade = jest.fn(async () => {
      await upgradeReleased;
      return {
        ok: true,
        message: "Upgrade completed. Restart Jumbo to use the new version.",
      };
    });
    const { stdin, lastFrame, unmount } = render(
      <App
        version="1.0.0"
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        cliUpdateController={{
          check: jest.fn(async () => ({
            status: "update-available",
            localVersion: "1.0.0",
            latestVersion: "1.1.0",
            feasibility: {
              feasible: true,
              command: "npm",
              args: ["install", "-g", "jumbo-cli@latest"],
            },
          })),
          upgrade,
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("notifications (1)"),
    );
    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("New version of Jumbo available"),
    );
    expect(lastFrame()).toContain("Upgrade to 1.1.0 or dismiss");
    expect(lastFrame()).toContain("u upgrade");

    stdin.write("u");
    await waitForFrame(lastFrame, (frame) =>
      /Jumbo update in progress [⠥⠏⠙⠁⠞⠊⠝⠛]/u.test(frame),
    );
    expect(lastFrame()).toContain("Local 1.0.0, latest 1.1.0.");
    expect(lastFrame()).toContain("Running npm upgrade.");

    completeUpgrade?.();
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Jumbo update completed"),
    );

    expect(upgrade).toHaveBeenCalledWith("1.1.0");
    unmount();
  }, 10000);

  it("shows manual update guidance when self-upgrade is unavailable", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        version="1.0.0"
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        cliUpdateController={{
          check: jest.fn(async () => ({
            status: "update-available",
            localVersion: "1.0.0",
            latestVersion: "1.1.0",
            feasibility: {
              feasible: false,
              reason: "self-upgrade-unavailable",
              guidance: "Run npm install -g jumbo-cli@latest",
            },
          })),
          upgrade: jest.fn(),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("notifications (1)"),
    );
    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Run npm install -g jumbo-cli@latest"),
    );

    expect(lastFrame()).not.toContain("u upgrade");
    unmount();
  }, 10000);

  it("does not pass daemon hotkeys to the cockpit while goal authoring is open", async () => {
    const stoppedDaemonSnapshot = {
      name: "refiner" as const,
      status: "stopped" as const,
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      stdout: [],
      stderr: [],
      events: [],
    };
    const subprocessManager: ISubprocessManager = {
      spawn: jest.fn(async () => stoppedDaemonSnapshot),
      terminate: jest.fn(async () => stoppedDaemonSnapshot),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((_name: DaemonName) => stoppedDaemonSnapshot),
      getAllStatuses: jest.fn(() => [stoppedDaemonSnapshot]),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
        subprocessManager={subprocessManager}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("s");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("s");
    await tick();

    expect(lastFrame()).toContain("Author Goal");
    expect(subprocessManager.spawn).not.toHaveBeenCalled();
    expect(subprocessManager.terminate).not.toHaveBeenCalled();
    unmount();
  }, 10000);

  it("returns to the primed-empty cockpit when goal authoring is cancelled", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("\x1b");
    await waitForFrame(
      lastFrame,
      (frame) =>
        frame.includes("Ready to create your first goal.") &&
        !frame.includes("Author Goal"),
    );

    expect(lastFrame()).not.toContain("Author Goal");
    expect(lastFrame()).toContain("Press");
    expect(lastFrame()).toContain("to add a goal");
    unmount();
  }, 10000);

  it("returns to the primed-empty cockpit when goal authoring completes", async () => {
    let lifecycleState: "primed-empty" | "primed" = "primed-empty";
    const addGoalRequests: AddGoalRequest[] = [];
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: {
            execute: async () => ({
              name: "Test Project",
              purpose: null,
              lifecycleState,
            }),
          },
        }}
        actionControllers={{
          addGoalController: {
            handle: async (request: AddGoalRequest) => {
              addGoalRequests.push(request);
              lifecycleState = "primed";
              return { goalId: "goal_created" };
            },
          },
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("Prototype Cockpit goal authoring");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Open goal authoring from Cockpit");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Wizard opens and closes");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("src/presentation tui");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("tests/presentation/tui");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("src/application layer");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("src/domain");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    const resultFrame = await waitForFrame(lastFrame, (frame) =>
      frame.includes("goal_created"),
    );

    expect(resultFrame).toContain(GoalAuthoringRequestStatus.SUCCESS);
    expect(resultFrame).toContain(GoalAuthoringResultCopy.goalIdLabel);
    stdin.write("m");
    await tick();
    expect(lastFrame()).toContain("goal_created");
    expect(lastFrame()).not.toContain("Navigate");

    expect(addGoalRequests).toEqual([
      {
        title: "Prototype Cockpit goal authoring",
        objective: "Open goal authoring from Cockpit",
        successCriteria: ["Wizard opens and closes"],
        scopeIn: ["src/presentation tui", "tests/presentation/tui"],
        scopeOut: ["src/application layer", "src/domain"],
        nextGoalId: undefined,
        previousGoalId: undefined,
        prerequisiteGoals: undefined,
        branch: undefined,
        worktree: undefined,
      },
    ]);
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));

    expect(lastFrame()).not.toContain(GoalAuthoringResultCopy.title);
    expect(lastFrame()).not.toContain("to add a goal");
    unmount();
  }, 10000);

  it("routes to the primed cockpit after creating a goal even before the summary reader catches up", async () => {
    const addGoalController = {
      handle: jest.fn(async (_request: AddGoalRequest) => ({
        goalId: "goal_created",
      })),
    };
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
        actionControllers={{
          addGoalController,
        }}
      />,
    );

    try {
      await waitForFrame(lastFrame, (frame) =>
        frame.includes("Ready to create your first goal."),
      );
      stdin.write("g");
      await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

      stdin.write("Prototype Cockpit goal authoring");
      await tick();
      stdin.write("\r");
      await tick();
      stdin.write("Open goal authoring from Cockpit");
      await tick();
      stdin.write("\r");
      await tick();
      stdin.write("Wizard opens and closes");
      await tick();
      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await waitForFrame(lastFrame, (frame) => frame.includes("Scope out"));
      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

      stdin.write("\r");
      await tick();
      stdin.write("\r");
      await waitForFrame(
        lastFrame,
        () => addGoalController.handle.mock.calls.length > 0,
      );

      const resultFrame = await waitForFrame(lastFrame, (frame) =>
        frame.includes("goal_created"),
      );
      expect(resultFrame).toContain(GoalAuthoringRequestStatus.SUCCESS);
      expect(resultFrame).not.toContain("EVENTS//");

      stdin.write("\r");
      await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));

      expect(lastFrame()).not.toContain("to add a goal");
      expect(lastFrame()).toContain("EVENTS//");
    } finally {
      unmount();
    }
  }, 10000);

  it("opens only the InitFlow when pressing i while the init shortcut is enabled", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        version="1.0.0"
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("uninitialized"),
        }}
        cliUpdateController={{
          check: jest.fn(async () => ({
            status: "update-available",
            localVersion: "1.0.0",
            latestVersion: "1.1.0",
            feasibility: {
              feasible: false,
              reason: "self-upgrade-unavailable",
              guidance: "Run npm install -g jumbo-cli@latest",
            },
          })),
          upgrade: jest.fn(),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("notifications (1)"),
    );
    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Initialize Project"),
    );

    expect(lastFrame()).toContain("Initialize Project");
    expect(lastFrame()).not.toContain("Notifications");
    unmount();
  }, 10000);

  it("suppresses shell shortcuts while the Goals screen authoring flow is open", async () => {
    const { stdin, lastFrame, unmount } = render(
      <App
        settingsReader={hiddenLaunchpadWelcomeSettingsReader()}
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    stdin.write("m");
    await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));
    stdin.write("\u001B[B");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("GOALS//"));

    stdin.write("n");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("q");
    await tick();
    stdin.write("m");
    await tick();
    stdin.write("/");
    await tick();
    stdin.write("i");
    await tick();

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).not.toContain("Navigate");
    expect(lastFrame()).not.toContain("Notifications");
    expect(lastFrame()).not.toContain("search memory");

    stdin.write("\x1b");
    await waitForFrame(lastFrame, (frame) => frame.includes("GOALS//"));
    stdin.write("m");
    await waitForFrame(lastFrame, (frame) => frame.includes("Navigate"));

    expect(lastFrame()).toContain("Navigate");
    unmount();
  }, 10000);
});
