/**
 * Agent Spawner
 *
 * Encapsulates supported agent CLI tools, their command mappings,
 * and the subprocess spawning logic used by work daemons.
 */

import { spawn } from "node:child_process";

import { SUPPORTED_AGENTS } from "./SupportedAgents.js";

export { SUPPORTED_AGENTS };
export type AgentId = (typeof SUPPORTED_AGENTS)[number];

export interface AgentCommand {
  readonly executable: string;
  readonly args?: readonly string[];
  readonly promptFlag?: string;
}

export const AGENT_COMMANDS: Record<AgentId, AgentCommand> = {
  claude: { executable: "claude", promptFlag: "-p" },
  antigravity: { executable: "agy", promptFlag: "-p" },
  copilot: { executable: "gh copilot", promptFlag: "-p" },
  codex: { executable: "codex", args: ["exec"] },
  cursor: { executable: "cursor", promptFlag: "-p" },
  vibe: { executable: "vibe", promptFlag: "-p" },
};

/**
 * Spawn an agent CLI subprocess with the given prompt.
 * Returns the exit code (0 = success, non-zero = failure).
 */
export function spawnAgent(agentId: AgentId, prompt: string): Promise<number> {
  const command = buildAgentCommandLine(AGENT_COMMANDS[agentId], prompt);

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      stdio: ["ignore", "ignore", "ignore"],
      shell: true,
    });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

export function buildAgentCommandLine(
  command: AgentCommand,
  prompt: string,
): string {
  const escaped = prompt.replace(/"/g, '\\"');
  return [
    command.executable,
    ...(command.args ?? []),
    ...(command.promptFlag === undefined ? [] : [command.promptFlag]),
    `"${escaped}"`,
  ].join(" ");
}
