import type { DaemonConfig } from "../daemon-subprocesses/ISubprocessManager.js";

const COCKPIT_DAEMON_AGENT_OPTIONS = [
  "codex",
  "claude",
  "antigravity",
  "copilot",
  "vibe",
] as const;

export function getNextCockpitDaemonAgentConfig(
  config: DaemonConfig,
): DaemonConfig {
  const currentIndex = COCKPIT_DAEMON_AGENT_OPTIONS.indexOf(
    config.agentId as (typeof COCKPIT_DAEMON_AGENT_OPTIONS)[number],
  );
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + 1) % COCKPIT_DAEMON_AGENT_OPTIONS.length;

  return { ...config, agentId: COCKPIT_DAEMON_AGENT_OPTIONS[nextIndex] };
}
