/**
 * HostSessionKeyResolver - Derives stable session keys from environment
 *
 * Resolves a unique, stable key for the current host session (terminal/IDE).
 * The key is derived from environment signals and remains stable for the
 * lifetime of the terminal or IDE session.
 *
 * Resolution Priority:
 * 1. IDE signals (VS Code, etc.)
 * 2. Terminal signals (Windows Terminal, iTerm2, macOS Terminal)
 * 3. Fallback: PPID + parent start time + user + hostname
 *
 * Cross-Platform Support:
 * - Windows: WT_SESSION, PowerShell parent process start time
 * - macOS: ITERM_SESSION_ID, TERM_SESSION_ID, ps command
 * - Linux: TERM_SESSION_ID, ps command
 */

import { createHash } from "crypto";
import { execSync } from "child_process";
import os from "os";

/**
 * Represents a component of the session key with its source.
 */
export type SessionKeyPart = {
  source: string;
  value: string;
};

/**
 * Result of resolving a host session key.
 */
export type HostSessionKeyResult = {
  key: string;
  parts: SessionKeyPart[];
};

export class HostSessionKeyResolver {
  /**
   * Resolves the host session key for the current process.
   *
   * The key is a SHA-256 hash of environment-derived components,
   * ensuring uniqueness per terminal/IDE session while remaining
   * stable across command invocations within the same session.
   *
   * @returns HostSessionKeyResult containing the key and its component parts
   */
  resolve(): HostSessionKeyResult {
    const parts: SessionKeyPart[] = [];

    const envSession = this.getEnvHostSessionId();
    if (envSession) {
      parts.push(envSession);
    } else {
      const ppid = process.ppid;
      const parentStartTime = this.getParentStartTime(ppid) ?? "unknown";

      parts.push({ source: "PPID", value: String(ppid) });
      parts.push({ source: "PSTART", value: parentStartTime });
      parts.push({ source: "USER", value: os.userInfo().username });
      parts.push({ source: "HOST", value: os.hostname() });
    }

    const key = this.hashParts(parts);
    return { key, parts };
  }

  /**
   * Attempts to get a session ID from environment variables.
   *
   * Checks for IDE and terminal-specific environment variables
   * that uniquely identify the current session.
   */
  private getEnvHostSessionId(): SessionKeyPart | null {
    const env = process.env;

    if (env.JUMBO_HOST_SESSION_KEY) {
      return {
        source: "JUMBO_HOST_SESSION_KEY",
        value: env.JUMBO_HOST_SESSION_KEY,
      };
    }

    // IDE signals (when running inside VS Code, etc.)
    if (env.VSCODE_IPC_HOOK_CLI) {
      return { source: "VSCODE_IPC_HOOK_CLI", value: env.VSCODE_IPC_HOOK_CLI };
    }
    if (env.VSCODE_PID) {
      return { source: "VSCODE_PID", value: env.VSCODE_PID };
    }

    // Terminal signals
    if (env.WT_SESSION) {
      return { source: "WT_SESSION", value: env.WT_SESSION };
    }
    if (env.ITERM_SESSION_ID) {
      return { source: "ITERM_SESSION_ID", value: env.ITERM_SESSION_ID };
    }
    if (env.TERM_SESSION_ID) {
      return { source: "TERM_SESSION_ID", value: env.TERM_SESSION_ID };
    }

    // Generic terminal program identification
    if (env.TERM_PROGRAM && env.TERM_PROGRAM_VERSION) {
      return {
        source: "TERM_PROGRAM",
        value: `${env.TERM_PROGRAM}:${env.TERM_PROGRAM_VERSION}`,
      };
    }

    return null;
  }

  /**
   * Gets the start time of the parent process.
   *
   * Uses platform-specific commands to retrieve the parent process
   * start time, which helps ensure uniqueness when no environment
   * session ID is available.
   */
  private getParentStartTime(ppid: number): string | null {
    if (process.platform === "win32") {
      return this.getParentStartTimeWindows(ppid);
    }
    return this.getParentStartTimeUnix(ppid);
  }

  /**
   * Gets parent process start time on Windows using PowerShell.
   */
  private getParentStartTimeWindows(ppid: number): string | null {
    try {
      const command = `powershell -NoProfile -Command "(Get-Process -Id ${ppid}).StartTime.ToString('o')"`;
      const output = execSync(command, {
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5000,
      })
        .toString()
        .trim();
      return output || null;
    } catch {
      return null;
    }
  }

  /**
   * Gets parent process start time on Unix-like systems using ps.
   */
  private getParentStartTimeUnix(ppid: number): string | null {
    try {
      const output = execSync(`ps -o lstart= -p ${ppid}`, {
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5000,
      })
        .toString()
        .trim();
      return output || null;
    } catch {
      return null;
    }
  }

  /**
   * Creates a SHA-256 hash from the session key parts.
   */
  private hashParts(parts: SessionKeyPart[]): string {
    const input = parts.map((p) => `${p.source}=${p.value}`).join("|");
    return createHash("sha256").update(input).digest("hex");
  }
}
